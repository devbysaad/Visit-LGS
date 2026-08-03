#!/usr/bin/env python3
"""Generate a dummy LGS Wah Cantt (Gudwal) campus map as Tiled JSON.

This is NOT an official layout — a typical Pakistani college footprint so
development can continue without a real site plan.

Critical: Main Gate is an OPEN walkable passage (pillars only). Spawning on a
colliding roof was the bug that trapped players.

Usage:
  python3 tools/gen_lgs_campus.py
  yarn gen-map
"""
from __future__ import annotations

import json
import os
import shutil
from copy import deepcopy

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MAP_DIR = os.path.join(ROOT, "client", "public", "assets", "map")
MAPS_DIR = os.path.join(ROOT, "client", "public", "assets", "maps")
SRC_TEMPLATE = os.path.join(MAP_DIR, "map.json")
OUT_MAP = os.path.join(MAP_DIR, "map.json")
OUT_CAMPUS = os.path.join(MAPS_DIR, "campus.json")
BACKUP = os.path.join(MAP_DIR, "map.office-backup.json")

PATH = 412
PLAZA = 835
WALL = 722
DOORSTEP = 835

ROOF = {
    "admin": 2085,
    "academic": 1457,
    "lab": 828,
    "canteen": 1318,
    "sport": 761,
    "gate": 1441,  # only for pillar posts, never the walkway
}

# Larger campus (~3× previous area)
W, H = 96, 72
TW = TH = 32
GATE_HALF = 3  # opening width = 7 tiles


def inb(x: int, y: int) -> bool:
    return 0 <= x < W and 0 <= y < H


def idx(x: int, y: int) -> int:
    return y * W + x


def fill_rect(G: list[int], x0: int, y0: int, w: int, h: int, gid: int) -> None:
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if inb(x, y):
                G[idx(x, y)] = gid


def stroke_rect(G: list[int], x0: int, y0: int, w: int, h: int, gid: int) -> None:
    for x in range(x0, x0 + w):
        if inb(x, y0):
            G[idx(x, y0)] = gid
        if inb(x, y0 + h - 1):
            G[idx(x, y0 + h - 1)] = gid
    for y in range(y0, y0 + h):
        if inb(x0, y):
            G[idx(x0, y)] = gid
        if inb(x0 + w - 1, y):
            G[idx(x0 + w - 1, y)] = gid


def hpath(G: list[int], x0: int, x1: int, y: int, gid: int = PATH, width: int = 3) -> None:
    half = width // 2
    for x in range(min(x0, x1), max(x0, x1) + 1):
        for dy in range(-half, half + 1):
            if inb(x, y + dy):
                G[idx(x, y + dy)] = gid


def vpath(G: list[int], y0: int, y1: int, x: int, gid: int = PATH, width: int = 3) -> None:
    half = width // 2
    for y in range(min(y0, y1), max(y0, y1) + 1):
        for dx in range(-half, half + 1):
            if inb(x + dx, y):
                G[idx(x + dx, y)] = gid


def stamp_building(G: list[int], x0: int, y0: int, w: int, h: int, roof: int, door: str) -> tuple[int, int]:
    fill_rect(G, x0, y0, w, h, roof)
    if door == "s":
        dx, dy = x0 + w // 2, y0 + h
    elif door == "n":
        dx, dy = x0 + w // 2, y0 - 1
    elif door == "e":
        dx, dy = x0 + w, y0 + h // 2
    else:
        dx, dy = x0 - 1, y0 + h // 2

    for ox in range(-2, 3):
        for oy in range(-2, 3):
            ax, ay = dx + ox, dy + oy
            if not inb(ax, ay):
                continue
            if G[idx(ax, ay)] == roof or G[idx(ax, ay)] == WALL:
                continue
            G[idx(ax, ay)] = PLAZA if abs(ox) + abs(oy) <= 1 else PATH
    if inb(dx, dy):
        G[idx(dx, dy)] = DOORSTEP
    return dx, dy


def stamp_open_gate(G: list[int], gate_x: int) -> tuple[int, int]:
    """Open walkable main gate: pillars left/right, PATH through the wall."""
    wall_y = H - 2
    # carve opening through south wall + approach
    for gx in range(gate_x - GATE_HALF, gate_x + GATE_HALF + 1):
        for gy in range(wall_y - 4, wall_y + 1):
            if inb(gx, gy):
                G[idx(gx, gy)] = PATH
        # outside apron south of wall
        if inb(gx, wall_y + 1):
            G[idx(gx, wall_y + 1)] = PATH

    # pillars (colliding) flanking the opening — not on the walkway
    for py in range(wall_y - 3, wall_y + 1):
        lx, rx = gate_x - GATE_HALF - 1, gate_x + GATE_HALF + 1
        if inb(lx, py):
            G[idx(lx, py)] = ROOF["gate"]
        if inb(rx, py):
            G[idx(rx, py)] = ROOF["gate"]

    # plaza pad just inside the gate
    fill_rect(G, gate_x - GATE_HALF - 1, wall_y - 6, GATE_HALF * 2 + 3, 3, PLAZA)
    # re-open path through plaza pad center
    for gx in range(gate_x - GATE_HALF, gate_x + GATE_HALF + 1):
        for gy in range(wall_y - 6, wall_y + 1):
            if inb(gx, gy):
                G[idx(gx, gy)] = PATH

    # interact zone center: on the walkable path at the threshold
    return gate_x, wall_y - 2


def obj(oid, name, x, y, w, h, props=None):
    o = {
        "id": oid,
        "name": name,
        "type": "",
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "rotation": 0,
        "visible": True,
    }
    if props:
        o["properties"] = props
    return o


def main() -> None:
    if not os.path.exists(BACKUP) and os.path.exists(SRC_TEMPLATE):
        shutil.copy2(SRC_TEMPLATE, BACKUP)
        print(f"Backed up previous map → {BACKUP}")

    template = json.load(open(BACKUP if os.path.exists(BACKUP) else SRC_TEMPLATE))

    tilesets = []
    for ts in template["tilesets"]:
        if ts["name"] in ("computer", "whiteboard"):
            continue
        tilesets.append(deepcopy(ts))

    max_gid_end = 1
    for ts in tilesets:
        max_gid_end = max(max_gid_end, ts["firstgid"] + ts.get("tilecount", 0))
    terrain_first = max_gid_end
    tilesets.append(
        {
            "columns": 8,
            "firstgid": terrain_first,
            "image": "../tileset/Terrain.png",
            "imageheight": 128,
            "imagewidth": 256,
            "margin": 0,
            "name": "Terrain",
            "spacing": 0,
            "tilecount": 32,
            "tileheight": 32,
            "tilewidth": 32,
            "tiles": [
                {"id": i, "properties": [{"name": "collides", "type": "bool", "value": True}]}
                for i in (24, 25, 26, 27, 28, 30)
            ],
        }
    )

    GRASS_A = terrain_first + 0
    GRASS_B = terrain_first + 1
    GRASS_C = terrain_first + 2
    FIELD = terrain_first + 4

    G = [GRASS_A] * (W * H)
    for y in range(H):
        for x in range(W):
            if (x + y) % 5 == 0:
                G[idx(x, y)] = GRASS_B
            elif (x * 3 + y) % 7 == 0:
                G[idx(x, y)] = GRASS_C

    # boundary
    stroke_rect(G, 1, 1, W - 2, H - 2, WALL)
    fill_rect(G, 2, 2, W - 4, H - 4, GRASS_A)
    for y in range(2, H - 2):
        for x in range(2, W - 2):
            if (x + y) % 5 == 0:
                G[idx(x, y)] = GRASS_B

    gate_x = W // 2
    gate_tile = stamp_open_gate(G, gate_x)

    # sports field NW (larger)
    fill_rect(G, 6, 6, 30, 18, FIELD)
    stroke_rect(G, 6, 6, 30, 18, PATH)

    # central plaza
    fill_rect(G, gate_x - 8, 28, 16, 12, PLAZA)

    # road network (wider)
    vpath(G, H - 3, 16, gate_x, width=5)
    hpath(G, 8, W - 9, 34, width=3)
    hpath(G, 8, W - 9, 22, width=3)
    vpath(G, 8, 40, 22, width=3)
    vpath(G, 8, 40, 70, width=3)

    # buildings — NOT including a solid main-gate roof
    buildings_spec = [
        ("admin-office", 62, 38, 10, 7, "admin", "w"),
        ("fee-counter", 76, 38, 8, 7, "admin", "w"),
        ("notice-board", 54, 40, 5, 4, "admin", "s"),
        ("library", 62, 10, 14, 10, "academic", "s"),
        ("classrooms", 10, 26, 16, 10, "academic", "e"),
        ("science-lab", 10, 42, 10, 7, "lab", "e"),
        ("computer-lab", 10, 52, 10, 7, "lab", "e"),
        ("canteen", 36, 46, 12, 7, "canteen", "n"),
        ("sports-ground", 12, 10, 10, 5, "sport", "s"),
    ]

    doors: dict[str, tuple[int, int]] = {"main-gate": gate_tile}
    for bid, bx, by, bw, bh, rkey, door in buildings_spec:
        doors[bid] = stamp_building(G, bx, by, bw, bh, ROOF[rkey], door)

    # ensure gate path still open after building stamps
    for gx in range(gate_x - GATE_HALF, gate_x + GATE_HALF + 1):
        for gy in range(H - 8, H - 1):
            if inb(gx, gy) and G[idx(gx, gy)] in (ROOF["gate"], WALL):
                G[idx(gx, gy)] = PATH
            elif inb(gx, gy):
                G[idx(gx, gy)] = PATH

    next_id = 1
    building_objs = []
    for bid, (dx, dy) in doors.items():
        zw, zh = (128, 128) if bid == "main-gate" else (96, 96)
        px = dx * TW + TW // 2 - zw // 2
        py = dy * TH + TH // 2 - zh // 2
        building_objs.append(
            obj(
                next_id,
                bid,
                px,
                py,
                zw,
                zh,
                [{"name": "buildingId", "type": "string", "value": bid}],
            )
        )
        next_id += 1

    npc_places = {
        "npc-senior": (gate_x + 3, H - 5),  # beside gate on path, not blocking
        "npc-clerk": doors["admin-office"],
        "npc-lab": doors["science-lab"],
        "npc-librarian": doors["library"],
    }
    npc_objs = []
    for nid, (nx, ny) in npc_places.items():
        # nudge off door onto path
        px = nx * TW + TW * 1.5
        py = ny * TH + TH
        if inb(nx + 1, ny) and G[idx(nx + 1, ny)] not in (
            ROOF["admin"],
            ROOF["academic"],
            ROOF["lab"],
            ROOF["canteen"],
            ROOF["sport"],
            ROOF["gate"],
            WALL,
        ):
            px = (nx + 1) * TW + TW // 2
            py = ny * TH + TH // 2
        npc_objs.append(
            obj(
                next_id,
                nid,
                float(px),
                float(py),
                0,
                0,
                [{"name": "npcId", "type": "string", "value": nid}],
            )
        )
        next_id += 1

    # Spawn OUTSIDE / on apron south of gate — walkable PATH, never on roof
    spawn_tx, spawn_ty = gate_x, H - 3
    # if somehow colliding, walk north into opening
    while spawn_ty > 0 and G[idx(spawn_tx, spawn_ty)] in (
        WALL,
        ROOF["gate"],
        ROOF["admin"],
        ROOF["academic"],
        ROOF["lab"],
        ROOF["canteen"],
        ROOF["sport"],
    ):
        spawn_ty -= 1
    G[idx(spawn_tx, spawn_ty)] = PATH
    spawn_x = spawn_tx * TW + TW // 2
    spawn_y = spawn_ty * TH + TH // 2
    spawn_objs = [obj(next_id, "spawn_gate", float(spawn_x), float(spawn_y), 0, 0)]
    next_id += 1

    chair_gid = next((ts["firstgid"] for ts in tilesets if ts["name"] == "chair"), None)
    chair_objs = []
    if chair_gid is not None:
        for i, (cx, cy) in enumerate(
            [(gate_x - 4, 30), (gate_x + 3, 30), (gate_x - 4, 33), (gate_x + 3, 33)]
        ):
            chair_objs.append(
                {
                    "id": next_id,
                    "name": f"bench-{i}",
                    "type": "",
                    "x": cx * TW,
                    "y": cy * TH + 64,
                    "width": 32,
                    "height": 64,
                    "rotation": 0,
                    "gid": chair_gid,
                    "visible": True,
                    "properties": [{"name": "direction", "type": "string", "value": "down"}],
                }
            )
            next_id += 1

    empty_layer_names = [
        "Wall",
        "Objects",
        "ObjectsOnCollide",
        "GenericObjects",
        "GenericObjectsOnCollide",
        "Basement",
        "VendingMachine",
        "benches",
    ]

    layers = [
        {
            "id": 1,
            "name": "Ground",
            "type": "tilelayer",
            "width": W,
            "height": H,
            "x": 0,
            "y": 0,
            "opacity": 1,
            "visible": True,
            "data": G,
        },
        {
            "id": 2,
            "name": "spawns",
            "type": "objectgroup",
            "draworder": "topdown",
            "x": 0,
            "y": 0,
            "opacity": 1,
            "visible": True,
            "objects": spawn_objs,
        },
        {
            "id": 3,
            "name": "buildings",
            "type": "objectgroup",
            "draworder": "topdown",
            "x": 0,
            "y": 0,
            "opacity": 1,
            "visible": True,
            "objects": building_objs,
        },
        {
            "id": 4,
            "name": "npcs",
            "type": "objectgroup",
            "draworder": "topdown",
            "x": 0,
            "y": 0,
            "opacity": 1,
            "visible": True,
            "objects": npc_objs,
        },
        {
            "id": 5,
            "name": "Chair",
            "type": "objectgroup",
            "draworder": "topdown",
            "x": 0,
            "y": 0,
            "opacity": 1,
            "visible": True,
            "objects": chair_objs,
        },
    ]
    lid = 6
    for name in empty_layer_names:
        layers.append(
            {
                "id": lid,
                "name": name,
                "type": "objectgroup",
                "draworder": "topdown",
                "x": 0,
                "y": 0,
                "opacity": 1,
                "visible": True,
                "objects": [],
            }
        )
        lid += 1

    out = {
        "compressionlevel": -1,
        "height": H,
        "width": W,
        "tileheight": TH,
        "tilewidth": TW,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "type": "map",
        "version": "1.8",
        "tiledversion": "1.8.2",
        "infinite": False,
        "nextlayerid": lid,
        "nextobjectid": next_id,
        "tilesets": tilesets,
        "layers": layers,
        "properties": [
            {
                "name": "campusquest_note",
                "type": "string",
                "value": "DUMMY LGS campus — open main gate + large map. tools/gen_lgs_campus.py",
            }
        ],
    }

    os.makedirs(MAPS_DIR, exist_ok=True)
    with open(OUT_MAP, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    with open(OUT_CAMPUS, "w") as f:
        json.dump(out, f, separators=(",", ":"))

    # sanity: spawn must not collide
    collide = set()
    for ts in tilesets:
        if ts["name"] == "FloorAndGround":
            for t in ts.get("tiles", []):
                props = {p["name"]: p.get("value") for p in t.get("properties", [])}
                if props.get("collides"):
                    collide.add(t["id"] + ts["firstgid"])
        if ts["name"] == "Terrain":
            for t in ts.get("tiles", []):
                props = {p["name"]: p.get("value") for p in t.get("properties", [])}
                if props.get("collides"):
                    collide.add(t["id"] + ts["firstgid"])
    sgid = G[idx(spawn_tx, spawn_ty)]
    print(f"Wrote {OUT_MAP}")
    print(f"Wrote {OUT_CAMPUS}")
    print(f"Size {W}x{H} tiles (~{W*TH}x{H*TW}px) | buildings={len(building_objs)} npcs={len(npc_objs)}")
    print(f"Spawn tile ({spawn_tx},{spawn_ty}) gid={sgid} collides={sgid in collide}")
    print("Main gate is an OPEN path — walk north through the opening into campus.")


if __name__ == "__main__":
    main()
