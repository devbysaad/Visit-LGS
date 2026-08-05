#!/usr/bin/env python3
"""Generate CampusQuest map: outdoor campus + separate interior 'islands'.

Vision: walk outdoor → Press E at a door → fade → only that building's
interior is visible (camera bounds). Exit door returns to campus.

Usage:
  python3 tools/gen_lgs_campus.py
  yarn gen-map
"""
from __future__ import annotations

import json
import os
import shutil
from copy import deepcopy
from typing import Dict, List, Optional, Tuple

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
VOID = 722  # colliding — fills space between outdoor and interiors

FLOOR = {
    "library": 898,
    "classrooms": 514,
    "admin": 770,
    "canteen": 385,
    "lab": 257,
}

DESK_GIDS = [2612, 2628, 3018, 3019]
DECOR_GIDS = [2596, 2782, 2798]
ROOF = {"admin": 2085, "academic": 1457, "lab": 828, "canteen": 1318, "sport": 761, "gate": 1441}

# Outdoor + void + interior islands
W, H = 200, 90
TW = TH = 32
GATE_HALF = 3

# Interior island origins (tile)
INT = {
    "library": (110, 6),
    "classrooms": (110, 40),
    "admin": (155, 6),
    "canteen": (155, 42),
}


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


def hwall(G: list[int], x0: int, x1: int, y: int, gap: Optional[Tuple[int, int]] = None) -> None:
    for x in range(min(x0, x1), max(x0, x1) + 1):
        if gap and gap[0] <= x <= gap[1]:
            continue
        if inb(x, y):
            G[idx(x, y)] = WALL


def vwall(G: list[int], y0: int, y1: int, x: int, gap: Optional[Tuple[int, int]] = None) -> None:
    for y in range(min(y0, y1), max(y0, y1) + 1):
        if gap and gap[0] <= y <= gap[1]:
            continue
        if inb(x, y):
            G[idx(x, y)] = WALL


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


def stamp_exterior(G: list[int], x0: int, y0: int, w: int, h: int, roof: int, door: str) -> Tuple[int, int]:
    """Solid outdoor building shell — not walkable. Doorstep outside for portal."""
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


def stamp_interior_shell(G: list[int], x0: int, y0: int, w: int, h: int, floor: int, exit_side: str) -> Tuple[int, int]:
    """Walkable interior rectangle with exit door gap. Returns exit doorstep tile."""
    fill_rect(G, x0, y0, w, h, floor)
    stroke_rect(G, x0, y0, w, h, WALL)
    if exit_side == "s":
        dx, dy = x0 + w // 2, y0 + h - 1
        for ox in range(-1, 2):
            if inb(dx + ox, dy):
                G[idx(dx + ox, dy)] = floor
            if inb(dx + ox, dy + 1):
                G[idx(dx + ox, dy + 1)] = DOORSTEP
        return dx, dy + 1
    if exit_side == "e":
        dx, dy = x0 + w - 1, y0 + h // 2
        for oy in range(-1, 2):
            if inb(dx, dy + oy):
                G[idx(dx, dy + oy)] = floor
            if inb(dx + 1, dy + oy):
                G[idx(dx + 1, dy + oy)] = DOORSTEP
        return dx + 1, dy
    if exit_side == "w":
        dx, dy = x0, y0 + h // 2
        for oy in range(-1, 2):
            if inb(dx, dy + oy):
                G[idx(dx, dy + oy)] = floor
            if inb(dx - 1, dy + oy):
                G[idx(dx - 1, dy + oy)] = DOORSTEP
        return dx - 1, dy
    # north
    dx, dy = x0 + w // 2, y0
    for ox in range(-1, 2):
        if inb(dx + ox, dy):
            G[idx(dx + ox, dy)] = floor
        if inb(dx + ox, dy - 1):
            G[idx(dx + ox, dy - 1)] = DOORSTEP
    return dx, dy - 1


def stamp_open_gate(G: list[int], gate_x: int) -> Tuple[int, int]:
    wall_y = 70  # outdoor south edge inside the outdoor region
    for gx in range(gate_x - GATE_HALF, gate_x + GATE_HALF + 1):
        for gy in range(wall_y - 4, wall_y + 1):
            if inb(gx, gy):
                G[idx(gx, gy)] = PATH
        if inb(gx, wall_y + 1):
            G[idx(gx, wall_y + 1)] = PATH
    for py in range(wall_y - 3, wall_y + 1):
        lx, rx = gate_x - GATE_HALF - 1, gate_x + GATE_HALF + 1
        if inb(lx, py):
            G[idx(lx, py)] = ROOF["gate"]
        if inb(rx, py):
            G[idx(rx, py)] = ROOF["gate"]
    fill_rect(G, gate_x - GATE_HALF - 1, wall_y - 6, GATE_HALF * 2 + 3, 3, PLAZA)
    for gx in range(gate_x - GATE_HALF, gate_x + GATE_HALF + 1):
        for gy in range(wall_y - 6, wall_y + 1):
            if inb(gx, gy):
                G[idx(gx, gy)] = PATH
    return gate_x, wall_y - 2


def obj(oid, name, x, y, w, h, props=None):
    o = {
        "id": oid,
        "name": name,
        "type": "",
        "x": float(x),
        "y": float(y),
        "width": w,
        "height": h,
        "rotation": 0,
        "visible": True,
    }
    if props:
        o["properties"] = props
    return o


def portal_obj(
    oid: int,
    portal_id: str,
    tx: int,
    ty: int,
    target_area: str,
    spawn_tx: int,
    spawn_ty: int,
    label: str,
    tw: int = 3,
    th: int = 2,
):
    return obj(
        oid,
        portal_id,
        (tx - tw // 2) * TW,
        (ty - th // 2) * TH,
        tw * TW,
        th * TH,
        [
            {"name": "portalId", "type": "string", "value": portal_id},
            {"name": "targetArea", "type": "string", "value": target_area},
            {"name": "spawnTileX", "type": "int", "value": spawn_tx},
            {"name": "spawnTileY", "type": "int", "value": spawn_ty},
            {"name": "label", "type": "string", "value": label},
        ],
    )


def area_obj(oid: int, area_id: str, x0: int, y0: int, w: int, h: int, name: str):
    """Metadata rect for camera bounds (not a physics trigger)."""
    return obj(
        oid,
        area_id,
        x0 * TW,
        y0 * TH,
        w * TW,
        h * TH,
        [
            {"name": "areaId", "type": "string", "value": area_id},
            {"name": "displayName", "type": "string", "value": name},
        ],
    )


def room_obj(oid: int, room_id: str, tx: int, ty: int, tw: int, th: int):
    return obj(
        oid,
        room_id,
        tx * TW,
        ty * TH,
        tw * TW,
        th * TH,
        [{"name": "roomId", "type": "string", "value": room_id}],
    )


def board_obj(oid: int, board_id: str, tx: int, ty: int, tw: int = 3, th: int = 1):
    return obj(
        oid,
        board_id,
        tx * TW,
        ty * TH,
        tw * TW,
        th * TH,
        [{"name": "boardId", "type": "string", "value": board_id}],
    )


def chair_obj(oid: int, name: str, tx: int, ty: int, gid: int, direction: str = "up"):
    return {
        "id": oid,
        "name": name,
        "type": "",
        "x": tx * TW,
        "y": ty * TH + 64,
        "width": 32,
        "height": 64,
        "rotation": 0,
        "gid": gid,
        "visible": True,
        "properties": [{"name": "direction", "type": "string", "value": direction}],
    }


def tiled_sprite(oid: int, name: str, tx: int, ty: int, gid: int, w: int = 32, h: int = 32):
    return {
        "id": oid,
        "name": name,
        "type": "",
        "x": tx * TW,
        "y": ty * TH + h,
        "width": w,
        "height": h,
        "rotation": 0,
        "gid": gid,
        "visible": True,
    }


def building_door_obj(oid: int, building_id: str, dx: int, dy: int):
    """Info trigger at outdoor door (optional overview)."""
    return obj(
        oid,
        building_id,
        dx * TW + TW // 2 - 48,
        dy * TH + TH // 2 - 32,
        96,
        64,
        [{"name": "buildingId", "type": "string", "value": building_id}],
    )


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

    # Fill everything with void first (interiors carved later; outdoor overwritten)
    G = [VOID] * (W * H)

    # --- Outdoor region (0..95, 0..71) ---
    OUT_W, OUT_H = 96, 72
    for y in range(OUT_H):
        for x in range(OUT_W):
            G[idx(x, y)] = GRASS_A
            if (x + y) % 5 == 0:
                G[idx(x, y)] = GRASS_B
            elif (x * 3 + y) % 7 == 0:
                G[idx(x, y)] = GRASS_C

    stroke_rect(G, 1, 1, OUT_W - 2, OUT_H - 2, WALL)
    fill_rect(G, 2, 2, OUT_W - 4, OUT_H - 4, GRASS_A)
    for y in range(2, OUT_H - 2):
        for x in range(2, OUT_W - 2):
            if (x + y) % 5 == 0:
                G[idx(x, y)] = GRASS_B

    gate_x = OUT_W // 2
    gate_tile = stamp_open_gate(G, gate_x)
    fill_rect(G, 6, 6, 28, 16, FIELD)
    stroke_rect(G, 6, 6, 28, 16, PATH)
    fill_rect(G, gate_x - 8, 30, 16, 10, PLAZA)
    vpath(G, OUT_H - 3, 14, gate_x, width=5)
    hpath(G, 6, OUT_W - 7, 36, width=3)
    hpath(G, 6, OUT_W - 7, 20, width=3)
    vpath(G, 8, 42, 20, width=3)
    vpath(G, 8, 42, 72, width=3)

    # Outdoor shells (solid) — portals stand on doorsteps
    exteriors = [
        ("library", 62, 10, 14, 10, "academic", "s"),
        ("classrooms", 10, 26, 16, 10, "academic", "e"),
        ("admin-office", 62, 38, 12, 8, "admin", "w"),
        ("canteen", 36, 46, 12, 7, "canteen", "n"),
        ("fee-counter", 78, 40, 8, 6, "admin", "w"),
        ("notice-board", 52, 40, 6, 5, "admin", "s"),
        ("science-lab", 10, 42, 10, 7, "lab", "e"),
        ("computer-lab", 10, 52, 10, 7, "lab", "e"),
        ("sports-ground", 12, 10, 10, 5, "sport", "s"),
    ]
    outdoor_doors: Dict[str, Tuple[int, int]] = {"main-gate": gate_tile}
    for bid, bx, by, bw, bh, rkey, door in exteriors:
        outdoor_doors[bid] = stamp_exterior(G, bx, by, bw, bh, ROOF[rkey], door)

    for gx in range(gate_x - GATE_HALF, gate_x + GATE_HALF + 1):
        for gy in range(OUT_H - 8, OUT_H - 1):
            if inb(gx, gy):
                G[idx(gx, gy)] = PATH

    next_id = 1
    portals: List[dict] = []
    areas: List[dict] = []
    rooms: List[dict] = []
    boards: List[dict] = []
    chairs: List[dict] = []
    desks: List[dict] = []
    decor: List[dict] = []
    buildings: List[dict] = []
    npcs: List[dict] = []

    chair_gid = next((ts["firstgid"] for ts in tilesets if ts["name"] == "chair"), None)
    chair_up = (chair_gid + 1) if chair_gid else None
    chair_down = (chair_gid + 5) if chair_gid else None

    def add_chairs(room_tag: str, rx: int, ry: int, rw: int, rh: int, direction: str = "up"):
        nonlocal next_id
        gid = chair_up if direction == "up" else chair_down
        if not gid:
            return
        for row, ty in enumerate(range(ry + 3, ry + rh - 1, 2)):
            if row > 2:
                break
            for col, tx in enumerate(range(rx + 2, rx + rw - 2, 2)):
                chairs.append(chair_obj(next_id, f"c-{room_tag}-{row}-{col}", tx, ty, gid, direction))
                next_id += 1

    def add_class_kit(tag: str, rx: int, ry: int, rw: int, rh: int, board_id: str):
        nonlocal next_id
        boards.append(board_obj(next_id, board_id, rx + rw // 2 - 1, ry + 1))
        next_id += 1
        if DESK_GIDS:
            desks.append(tiled_sprite(next_id, f"desk-{tag}", rx + rw // 2, ry + 2, DESK_GIDS[0]))
            next_id += 1
        add_chairs(tag, rx, ry, rw, rh, "up")

    # Outdoor area bounds metadata
    areas.append(area_obj(next_id, "outdoor", 0, 0, OUT_W, OUT_H, "Campus Grounds"))
    next_id += 1

    # --- LIBRARY INTERIOR ---
    lx, ly = INT["library"]
    lw, lh = 28, 22
    fill_rect(G, lx - 2, ly - 2, lw + 4, lh + 4, VOID)  # dark surround
    lib_exit = stamp_interior_shell(G, lx, ly, lw, lh, FLOOR["library"], "s")
    vwall(G, ly + 1, ly + 10, lx + 14, gap=(ly + 4, ly + 6))
    hwall(G, lx + 1, lx + lw - 2, ly + 10, gap=(lx + 12, lx + 15))
    hwall(G, lx + 1, lx + lw - 2, ly + 16, gap=(lx + 12, lx + 15))
    vwall(G, ly + 17, ly + lh - 2, lx + 14, gap=(ly + 17, ly + 18))
    rooms.extend(
        [
            room_obj(next_id, "lib-study-area", lx + 1, ly + 1, 13, 9),
            room_obj(next_id + 1, "lib-computer-lab", lx + 15, ly + 1, 12, 9),
            room_obj(next_id + 2, "lib-stacks", lx + 1, ly + 11, 26, 5),
            room_obj(next_id + 3, "lib-admin", lx + 1, ly + 17, 13, 4),
            room_obj(next_id + 4, "lib-washrooms", lx + 15, ly + 17, 12, 4),
        ]
    )
    next_id += 5
    add_chairs("lib-study", lx + 1, ly + 1, 13, 9, "down")
    add_class_kit("lib-pc", lx + 15, ly + 1, 12, 9, "board-lib-computer")
    boards.append(board_obj(next_id, "board-lib-admin", lx + 3, ly + 17, 2, 1))
    next_id += 1
    areas.append(area_obj(next_id, "library", lx - 1, ly - 1, lw + 2, lh + 2, "Library"))
    next_id += 1
    # enter portal outdoor → interior spawn (inside near exit)
    odx, ody = outdoor_doors["library"]
    portals.append(
        portal_obj(
            next_id,
            "enter-library",
            odx,
            ody,
            "library",
            lx + lw // 2,
            ly + lh - 3,
            "Enter Library",
        )
    )
    next_id += 1
    portals.append(
        portal_obj(
            next_id,
            "exit-library",
            lib_exit[0],
            lib_exit[1],
            "outdoor",
            odx,
            ody + 1,
            "Exit to Campus",
        )
    )
    next_id += 1

    # --- CLASSROOMS INTERIOR ---
    cx, cy = INT["classrooms"]
    cw, ch = 36, 26
    fill_rect(G, cx - 2, cy - 2, cw + 4, ch + 4, VOID)
    class_exit = stamp_interior_shell(G, cx, cy, cw, ch, FLOOR["classrooms"], "e")
    vwall(G, cy + 1, cy + 12, cx + 12, gap=(cy + 5, cy + 7))
    vwall(G, cy + 1, cy + 12, cx + 24, gap=(cy + 5, cy + 7))
    hwall(G, cx + 1, cx + cw - 2, cy + 12, gap=(cx + 16, cx + 19))
    vwall(G, cy + 13, cy + ch - 2, cx + 18, gap=(cy + 16, cy + 18))
    rooms.extend(
        [
            room_obj(next_id, "class-math", cx + 1, cy + 1, 11, 11),
            room_obj(next_id + 1, "class-physics", cx + 13, cy + 1, 11, 11),
            room_obj(next_id + 2, "class-computer", cx + 25, cy + 1, 10, 11),
            room_obj(next_id + 3, "lab-computer", cx + 1, cy + 13, 17, 12),
            room_obj(next_id + 4, "lab-physics", cx + 19, cy + 13, 16, 12),
        ]
    )
    next_id += 5
    add_class_kit("math", cx + 1, cy + 1, 11, 11, "board-class-math")
    add_class_kit("phys", cx + 13, cy + 1, 11, 11, "board-class-physics")
    add_class_kit("comp", cx + 25, cy + 1, 10, 11, "board-class-computer")
    add_class_kit("labc", cx + 1, cy + 13, 17, 12, "board-lab-computer")
    add_class_kit("labp", cx + 19, cy + 13, 16, 12, "board-lab-physics")
    areas.append(area_obj(next_id, "classrooms", cx - 1, cy - 1, cw + 2, ch + 2, "Classrooms"))
    next_id += 1
    odx, ody = outdoor_doors["classrooms"]
    portals.append(
        portal_obj(next_id, "enter-classrooms", odx, ody, "classrooms", cx + cw - 4, cy + ch // 2, "Enter Classrooms")
    )
    next_id += 1
    portals.append(
        portal_obj(next_id, "exit-classrooms", class_exit[0], class_exit[1], "outdoor", odx - 1, ody, "Exit to Campus")
    )
    next_id += 1

    # --- ADMIN INTERIOR ---
    ax, ay = INT["admin"]
    aw, ah = 26, 20
    fill_rect(G, ax - 2, ay - 2, aw + 4, ah + 4, VOID)
    admin_exit = stamp_interior_shell(G, ax, ay, aw, ah, FLOOR["admin"], "w")
    vwall(G, ay + 1, ay + 11, ax + 13, gap=(ay + 5, ay + 7))
    hwall(G, ax + 1, ax + aw - 2, ay + 11, gap=(ax + 10, ax + 13))
    rooms.extend(
        [
            room_obj(next_id, "admin-waiting", ax + 1, ay + 1, 12, 10),
            room_obj(next_id + 1, "admin-office-room", ax + 14, ay + 1, 11, 10),
            room_obj(next_id + 2, "admin-balcony", ax + 1, ay + 12, 24, 7),
        ]
    )
    next_id += 3
    add_chairs("wait", ax + 1, ay + 1, 12, 10, "down")
    if DESK_GIDS:
        desks.append(tiled_sprite(next_id, "desk-admin", ax + 18, ay + 4, DESK_GIDS[1]))
        next_id += 1
    boards.append(board_obj(next_id, "board-admin", ax + 16, ay + 1))
    next_id += 1
    areas.append(area_obj(next_id, "admin", ax - 1, ay - 1, aw + 2, ah + 2, "Admin Building"))
    next_id += 1
    odx, ody = outdoor_doors["admin-office"]
    portals.append(portal_obj(next_id, "enter-admin", odx, ody, "admin", ax + 3, ay + ah // 2, "Enter Admin"))
    next_id += 1
    portals.append(
        portal_obj(next_id, "exit-admin", admin_exit[0], admin_exit[1], "outdoor", odx + 1, ody, "Exit to Campus")
    )
    next_id += 1

    # --- CANTEEN INTERIOR ---
    qx, qy = INT["canteen"]
    qw, qh = 24, 18
    fill_rect(G, qx - 2, qy - 2, qw + 4, qh + 4, VOID)
    can_exit = stamp_interior_shell(G, qx, qy, qw, qh, FLOOR["canteen"], "n")
    rooms.append(room_obj(next_id, "canteen-hall", qx + 1, qy + 1, qw - 2, qh - 2))
    next_id += 1
    add_chairs("canteen", qx + 1, qy + 5, qw - 2, qh - 6, "down")
    if DESK_GIDS:
        desks.append(tiled_sprite(next_id, "counter-canteen", qx + qw // 2, qy + 2, DESK_GIDS[2]))
        next_id += 1
    areas.append(area_obj(next_id, "canteen", qx - 1, qy - 1, qw + 2, qh + 2, "Canteen"))
    next_id += 1
    odx, ody = outdoor_doors["canteen"]
    # Spawn in clear aisle south of the counter (not on chairs/desk)
    canteen_spawn = (qx + qw // 2, qy + 8)
    portals.append(
        portal_obj(next_id, "enter-canteen", odx, ody, "canteen", canteen_spawn[0], canteen_spawn[1], "Enter Canteen")
    )
    next_id += 1
    portals.append(
        portal_obj(
            next_id,
            "exit-canteen",
            can_exit[0],
            can_exit[1],
            "outdoor",
            odx,
            ody,
            "Exit to Campus",
        )
    )
    next_id += 1

    # Outdoor building info triggers + portals for smaller buildings → still outdoor info only
    for bid, (dx, dy) in outdoor_doors.items():
        buildings.append(building_door_obj(next_id, bid, dx, dy))
        next_id += 1

    # NPCs (outdoor)
    npc_places = {
        "npc-senior": (gate_x + 3, OUT_H - 5),
        "npc-clerk": (outdoor_doors["admin-office"][0] - 1, outdoor_doors["admin-office"][1]),
        "npc-lab": (outdoor_doors["science-lab"][0] + 1, outdoor_doors["science-lab"][1]),
        "npc-librarian": (outdoor_doors["library"][0], outdoor_doors["library"][1] + 1),
        "npc-teacher": (outdoor_doors["classrooms"][0] + 1, outdoor_doors["classrooms"][1]),
    }
    for nid, (nx, ny) in npc_places.items():
        npcs.append(
            obj(
                next_id,
                nid,
                nx * TW + TW // 2,
                ny * TH + TH // 2,
                0,
                0,
                [{"name": "npcId", "type": "string", "value": nid}],
            )
        )
        next_id += 1

    # Interior ambient NPC anchors (students / staff standing points — Phaser will animate)
    ambient = [
        ("ambient-lib-1", lx + 4, ly + 4, "library"),
        ("ambient-lib-2", lx + 20, ly + 5, "library"),
        ("ambient-class-1", cx + 5, cy + 6, "classrooms"),
        ("ambient-class-2", cx + 16, cy + 6, "classrooms"),
        ("ambient-class-3", cx + 8, cy + 18, "classrooms"),
        ("ambient-admin-1", ax + 5, ay + 5, "admin"),
        ("ambient-canteen-1", qx + 8, qy + 8, "canteen"),
        ("ambient-canteen-2", qx + 14, qy + 10, "canteen"),
    ]
    ambient_objs = []
    for name, tx, ty, area in ambient:
        ambient_objs.append(
            obj(
                next_id,
                name,
                tx * TW + TW // 2,
                ty * TH + TH // 2,
                0,
                0,
                [
                    {"name": "ambientId", "type": "string", "value": name},
                    {"name": "areaId", "type": "string", "value": area},
                ],
            )
        )
        next_id += 1

    spawn_tx, spawn_ty = gate_x, OUT_H - 3
    G[idx(spawn_tx, spawn_ty)] = PATH
    spawns = [obj(next_id, "spawn_gate", spawn_tx * TW + TW // 2, spawn_ty * TH + TH // 2, 0, 0)]
    next_id += 1

    if chair_down:
        for i, (chx, chy) in enumerate([(gate_x - 4, 32), (gate_x + 3, 32), (gate_x - 4, 34), (gate_x + 3, 34)]):
            chairs.append(chair_obj(next_id, f"bench-{i}", chx, chy, chair_down, "down"))
            next_id += 1

    for bucket in (portals, areas, rooms, boards, chairs, desks, decor, buildings, npcs, ambient_objs, spawns):
        for item in bucket:
            item["id"] = next_id
            next_id += 1

    layers = [
        {"id": 1, "name": "Ground", "type": "tilelayer", "width": W, "height": H, "x": 0, "y": 0, "opacity": 1, "visible": True, "data": G},
        {"id": 2, "name": "spawns", "type": "objectgroup", "draworder": "topdown", "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": spawns},
        {"id": 3, "name": "areas", "type": "objectgroup", "draworder": "topdown", "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": areas},
        {"id": 4, "name": "portals", "type": "objectgroup", "draworder": "topdown", "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": portals},
        {"id": 5, "name": "buildings", "type": "objectgroup", "draworder": "topdown", "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": buildings},
        {"id": 6, "name": "rooms", "type": "objectgroup", "draworder": "topdown", "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": rooms},
        {"id": 7, "name": "boards", "type": "objectgroup", "draworder": "topdown", "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": boards},
        {"id": 8, "name": "npcs", "type": "objectgroup", "draworder": "topdown", "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": npcs},
        {"id": 9, "name": "ambient", "type": "objectgroup", "draworder": "topdown", "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": ambient_objs},
        {"id": 10, "name": "Chair", "type": "objectgroup", "draworder": "topdown", "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": chairs},
        {"id": 11, "name": "Objects", "type": "objectgroup", "draworder": "topdown", "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": decor},
        {"id": 12, "name": "ObjectsOnCollide", "type": "objectgroup", "draworder": "topdown", "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": desks},
    ]
    lid = 13
    for name in ("Wall", "GenericObjects", "GenericObjectsOnCollide", "Basement", "VendingMachine", "benches"):
        layers.append(
            {"id": lid, "name": name, "type": "objectgroup", "draworder": "topdown", "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": []}
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
                "value": "Outdoor campus + separate interior islands. Portal enter/exit. tools/gen_lgs_campus.py",
            }
        ],
    }

    os.makedirs(MAPS_DIR, exist_ok=True)
    with open(OUT_MAP, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    with open(OUT_CAMPUS, "w") as f:
        json.dump(out, f, separators=(",", ":"))

    print(f"Wrote {OUT_MAP}")
    print(f"Wrote {OUT_CAMPUS}")
    print(f"Size {W}x{H} | portals={len(portals)} areas={len(areas)} rooms={len(rooms)} chairs={len(chairs)}")
    print("Outdoor shells + interior islands. Press E at doors to enter/exit.")


if __name__ == "__main__":
    main()
