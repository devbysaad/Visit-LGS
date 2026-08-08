#!/usr/bin/env python3
"""Generate the CampusQuest map from the hand-drawn Excalidraw site plan.

Outdoor campus (120 x 92 tiles):
  - Two long two-storey academic wings stacked north/south: A-Level and O-Level
  - A landscaped walking area down the east side
  - Parking and the sports ground along the south, main gate on the south wall
  - A drivable ring: gate, main drive, cross drives to both wing entrances

Each wing floor is an interior "island" east of the campus, laid out like the
drawing: a north band of classrooms plus the staff room, a full-width corridor
with the stairwell at its east end, a south band holding the 2x2 lab block, the
open "small ground" courtyard and the six-classroom block, and — on ground
floors — an east column with the wing library, offices and reception.

Camera and physics bounds clip to the active `areas` rect, so you only ever see
the floor you are standing on. Stairs are ordinary portals between two floor
areas of the same wing.

Usage:
  python3 tools/gen_lgs_campus.py
  yarn gen-map
"""
from __future__ import annotations

import json
import os
import shutil
from copy import deepcopy
from typing import Dict, List, Optional, Sequence, Set, Tuple

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MAP_DIR = os.path.join(ROOT, "client", "public", "assets", "map")
MAPS_DIR = os.path.join(ROOT, "client", "public", "assets", "maps")
SRC_TEMPLATE = os.path.join(MAP_DIR, "map.json")
OUT_MAP = os.path.join(MAP_DIR, "map.json")
OUT_CAMPUS = os.path.join(MAPS_DIR, "campus.json")
BACKUP = os.path.join(MAP_DIR, "map.office-backup.json")

# Tile gids. Collision comes from the tileset's `collides` property, so every gid
# below is asserted against the template in `assert_collision_contract()` — a
# walkable roof or a solid car park is a silent, hard-to-spot bug otherwise.
ROAD = 412
SIDEWALK = 835
PLAZA = 835
WALL = 722
DOORSTEP = 835
VOID = 722  # colliding filler between the outdoor campus and the interior islands
PARKING = 412

# Outdoor shells are all one solid gid; their look comes from the procedural
# facades drawn in client/src/scenes/CampusDecor.ts, not from tile art.
SHELL = 722
GATE_POST = 1441

FLOOR = {
    "a-level-ground": 514,
    "a-level-first": 898,
    "o-level-ground": 770,
    "o-level-first": 385,
}
CORRIDOR_GID = 1027
EAST_GID = 257

# Facade palette keys consumed by the client (see FACADE_STYLES in CampusDecor.ts).
STYLE = {
    "a-level-block": "teal",
    "o-level-block": "plum",
    "notice-board": "slate",
}

DESK_GIDS = [2612, 2628, 3018, 3019]

# ---------------------------------------------------------------------- extents
W, H = 248, 130
TW = TH = 32
OUT_W, OUT_H = 120, 92
GATE_HALF = 3

# Interior island origins (tile coords), all east of the outdoor campus.
INT: Dict[str, Tuple[int, int]] = {
    "a-level-ground": (124, 3),
    "o-level-ground": (124, 35),
    "a-level-first": (124, 67),
    "o-level-first": (124, 99),
}

# ------------------------------------------------------------------ wing layout
# One wing floor. Ground floors add an east column; upper floors stop at the
# main section, so the drawn library/offices column exists only downstairs.
MAIN_W = 100  # interior width of the main section
EAST_W = 15  # interior width of the east column
NORTH_H = 9
CORR_H = 4
SOUTH_H = 11
WING_H = 1 + NORTH_H + 1 + CORR_H + 1 + SOUTH_H + 1  # 28

# North band cell widths, west to east. The last cell absorbs the remainder.
NORTH_GROUND = [14, 14, 14, 12, 22, 19]  # class, class, prep, washrooms, staff, stairwell
NORTH_FIRST = [14, 34, 12, 17, 19]  # class, hall, washrooms, staff, stairwell

# South band spans, measured from the first interior column of the main section.
LAB_W = 28  # 2x2 lab block
COURT_W = 16  # the open "small ground" courtyard
BLOCK_CELLS = [8, 8, 8, 8, 8, 9]  # the six-classroom block
EAST_ROWS = [9, 8, 7]  # library, office, principal or canteen — stacked in the east column

WINGS = [
    {
        "key": "a",
        "building": "a-level-block",
        "name": "A-Level Block",
        "shell": (8, 10, 76, 18),
        "ground": "a-level-ground",
        "first": "a-level-first",
        "hall": "a-exam-hall",
        "east_mid": "accounts-office",
        "east_bottom": "principal-office",
    },
    {
        "key": "o",
        "building": "o-level-block",
        "name": "O-Level Block",
        "shell": (8, 38, 76, 18),
        "ground": "o-level-ground",
        "first": "o-level-first",
        "hall": "o-activity-hall",
        "east_mid": "admin-office-room",
        "east_bottom": "canteen-hall",
    },
]

# 30 classrooms, 8 / 7 per floor. Ids mirror client/src/content/rooms.ts.
GROUND_CLASSES = 8
FIRST_CLASSES = 7


def classroom_ids(key: str, floor: str) -> List[str]:
    n = GROUND_CLASSES if floor == "ground" else FIRST_CLASSES
    tag = "g" if floor == "ground" else "f"
    return [f"{key}{tag}-c{i}" for i in range(1, n + 1)]


def assert_collision_contract(tilesets) -> Set[int]:
    """Fail loudly if a floor tile blocks movement or a shell tile does not."""
    colliding = set()
    for ts in tilesets:
        first = ts["firstgid"]
        for tile in ts.get("tiles", []) or []:
            for prop in tile.get("properties", []) or []:
                if prop["name"] == "collides" and prop["value"]:
                    colliding.add(first + tile["id"])

    problems = []
    walkable = [
        ("ROAD", ROAD),
        ("SIDEWALK", SIDEWALK),
        ("PARKING", PARKING),
        ("DOORSTEP", DOORSTEP),
        ("CORRIDOR", CORRIDOR_GID),
        ("EAST", EAST_GID),
    ]
    for name, gid in walkable:
        if gid in colliding:
            problems.append(f"{name} gid {gid} collides but must be walkable")
    for name, gid in FLOOR.items():
        if gid in colliding:
            problems.append(f"FLOOR[{name}] gid {gid} collides but must be walkable")
    for name, gid in [("WALL", WALL), ("VOID", VOID), ("SHELL", SHELL), ("GATE_POST", GATE_POST)]:
        if gid not in colliding:
            problems.append(f"{name} gid {gid} is walkable but must block")
    if problems:
        raise SystemExit("Tile collision contract violated:\n  - " + "\n  - ".join(problems))
    return colliding


def inb(x: int, y: int) -> bool:
    return 0 <= x < W and 0 <= y < H


def idx(x: int, y: int) -> int:
    return y * W + x


def fill_rect(G: List[int], x0: int, y0: int, w: int, h: int, gid: int) -> None:
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if inb(x, y):
                G[idx(x, y)] = gid


def stroke_rect(G: List[int], x0: int, y0: int, w: int, h: int, gid: int) -> None:
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


def hwall(G: List[int], x0: int, x1: int, y: int, gap: Optional[Tuple[int, int]] = None) -> None:
    for x in range(min(x0, x1), max(x0, x1) + 1):
        if gap and gap[0] <= x <= gap[1]:
            continue
        if inb(x, y):
            G[idx(x, y)] = WALL


def vwall(G: List[int], y0: int, y1: int, x: int, gap: Optional[Tuple[int, int]] = None) -> None:
    for y in range(min(y0, y1), max(y0, y1) + 1):
        if gap and gap[0] <= y <= gap[1]:
            continue
        if inb(x, y):
            G[idx(x, y)] = WALL


def hroad(G: List[int], x0: int, x1: int, y: int, gid: int = ROAD, width: int = 5) -> None:
    half = width // 2
    for x in range(min(x0, x1), max(x0, x1) + 1):
        for dy in range(-half, half + 1):
            if inb(x, y + dy):
                G[idx(x, y + dy)] = gid


def vroad(G: List[int], y0: int, y1: int, x: int, gid: int = ROAD, width: int = 5) -> None:
    half = width // 2
    for y in range(min(y0, y1), max(y0, y1) + 1):
        for dx in range(-half, half + 1):
            if inb(x + dx, y):
                G[idx(x + dx, y)] = gid


def door_h(G: List[int], x: int, y: int, gid: int, width: int = 2) -> None:
    """Punch a doorway of `width` tiles through a horizontal wall."""
    for dx in range(width):
        if inb(x + dx, y):
            G[idx(x + dx, y)] = gid


def door_v(G: List[int], x: int, y: int, gid: int, height: int = 2) -> None:
    """Punch a doorway of `height` tiles through a vertical wall."""
    for dy in range(height):
        if inb(x, y + dy):
            G[idx(x, y + dy)] = gid


def cells(a: int, b: int, widths: Sequence[int]) -> List[Tuple[int, int]]:
    """Slice the span [a, b] into cells separated by a single wall tile.

    The last cell absorbs whatever is left, so the span is always filled exactly
    and a mis-summed width table shows up as one odd-sized room rather than a
    hole in the floor plan.
    """
    out: List[Tuple[int, int]] = []
    cursor = a
    for i, width in enumerate(widths):
        span = (b - cursor + 1) if i == len(widths) - 1 else width
        out.append((cursor, cursor + span - 1))
        cursor += span + 1
    return out


def stamp_exterior(
    G: List[int], x0: int, y0: int, w: int, h: int, roof: int, door: str
) -> Tuple[int, int]:
    """Solid outdoor shell (not walkable). Returns the doorstep tile just outside."""
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
            if not inb(ax, ay) or G[idx(ax, ay)] in (roof, WALL):
                continue
            G[idx(ax, ay)] = PLAZA if abs(ox) + abs(oy) <= 1 else SIDEWALK
    if inb(dx, dy):
        G[idx(dx, dy)] = DOORSTEP
    return dx, dy


class Wing:
    """One floor of a long academic wing, laid out like the Excalidraw plan.

    North band (classrooms + staff room), a full-width corridor with the
    stairwell at its east end, then the south band: 2x2 lab block, the open
    "small ground" courtyard and the six-classroom block. Ground floors also get
    the east column holding the library, offices and reception.
    """

    def __init__(self, x0: int, y0: int, has_east: bool):
        self.x0, self.y0 = x0, y0
        self.has_east = has_east
        self.w = 1 + MAIN_W + 1 + (EAST_W + 1 if has_east else 0)
        self.h = WING_H

        self.mx0 = x0 + 1
        self.mx1 = x0 + MAIN_W
        self.east_wall = self.mx1 + 1
        self.ex0 = self.east_wall + 1
        self.ex1 = self.ex0 + EAST_W - 1

        self.ny0 = y0 + 1
        self.ny1 = self.ny0 + NORTH_H - 1
        self.wall_n = self.ny1 + 1
        self.cy0 = self.wall_n + 1
        self.cy1 = self.cy0 + CORR_H - 1
        self.wall_s = self.cy1 + 1
        self.sy0 = self.wall_s + 1
        self.sy1 = self.sy0 + SOUTH_H - 1
        self.sub_wall = self.sy0 + 5
        self.cmid = (self.cy0 + self.cy1) // 2

        self.exit_tile: Tuple[int, int] = (x0 - 1, self.cmid)
        self.entry_tile: Tuple[int, int] = (x0 + 2, self.cmid)
        self.stair_tile: Tuple[int, int] = (x0, y0)

    def stamp_shell(self, G: List[int], floor_gid: int) -> None:
        fill_rect(G, self.x0 - 3, self.y0 - 3, self.w + 6, self.h + 6, VOID)
        fill_rect(G, self.x0, self.y0, self.w, self.h, floor_gid)
        stroke_rect(G, self.x0, self.y0, self.w, self.h, WALL)
        fill_rect(G, self.mx0, self.cy0, MAIN_W, CORR_H, CORRIDOR_GID)
        hwall(G, self.mx0, self.mx1, self.wall_n)
        hwall(G, self.mx0, self.mx1, self.wall_s)

        # West doorway onto the campus, at the corridor end
        for y in range(self.cy0, self.cy1 + 1):
            G[idx(self.x0, y)] = CORRIDOR_GID
            G[idx(self.x0 - 1, y)] = DOORSTEP


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


def point_obj(oid: int, name: str, tx: int, ty: int, props: List[dict]):
    return obj(oid, name, tx * TW + TW // 2, ty * TH + TH // 2, 0, 0, props)


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
    return obj(
        oid,
        building_id,
        dx * TW + TW // 2 - 48,
        dy * TH + TH // 2 - 32,
        96,
        64,
        [{"name": "buildingId", "type": "string", "value": building_id}],
    )


def flood(
    G: List[int],
    colliding: Set[int],
    start: Tuple[int, int],
    x0: int,
    y0: int,
    x1: int,
    y1: int,
) -> Set[Tuple[int, int]]:
    """Walkable tiles reachable from `start`, clipped to the given rect."""
    seen: Set[Tuple[int, int]] = set()
    stack = [start]
    while stack:
        x, y = stack.pop()
        if (x, y) in seen:
            continue
        if not (x0 <= x <= x1 and y0 <= y <= y1) or not inb(x, y):
            continue
        if G[idx(x, y)] in colliding:
            continue
        seen.add((x, y))
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return seen


def main() -> None:
    if not os.path.exists(BACKUP) and os.path.exists(SRC_TEMPLATE):
        shutil.copy2(SRC_TEMPLATE, BACKUP)
        print(f"Backed up previous map → {BACKUP}")

    template = json.load(open(BACKUP if os.path.exists(BACKUP) else SRC_TEMPLATE))
    tilesets = [deepcopy(ts) for ts in template["tilesets"] if ts["name"] not in ("computer", "whiteboard")]

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
    colliding = assert_collision_contract(tilesets)

    GRASS_A = terrain_first + 0
    GRASS_B = terrain_first + 1
    GRASS_C = terrain_first + 2
    FIELD = terrain_first + 4

    G = [VOID] * (W * H)

    # ------------------------------------------------------------------ outdoor
    for y in range(OUT_H):
        for x in range(OUT_W):
            gid = GRASS_A
            if (x + y) % 5 == 0:
                gid = GRASS_B
            elif (x * 3 + y) % 7 == 0:
                gid = GRASS_C
            G[idx(x, y)] = gid

    stroke_rect(G, 1, 1, OUT_W - 2, OUT_H - 2, WALL)

    DRIVE_X = 88
    gate_x, gate_y = DRIVE_X, OUT_H - 4

    # Landscaped walking area down the east side, laid out before the drive so
    # the perimeter road stays on top of it.
    WALK = (94, 8, 21, 73)
    fill_rect(G, *WALK, GRASS_B)
    stroke_rect(G, WALK[0] + 2, WALK[1] + 4, WALK[2] - 4, WALK[3] - 8, SIDEWALK)
    for wy in range(WALK[1] + 6, WALK[1] + WALK[3] - 6):
        G[idx(WALK[0] + WALK[2] // 2, wy)] = SIDEWALK

    # Drivable spine: gate to the north edge, with cross drives at each wing
    vroad(G, 6, gate_y + 2, DRIVE_X, width=5)
    hroad(G, 10, DRIVE_X, 6, width=5)
    hroad(G, 10, DRIVE_X, 32, width=5)
    hroad(G, 10, DRIVE_X, 60, width=5)
    hroad(G, 10, 112, 86, width=5)

    # Gate opening in the south wall
    for gx in range(gate_x - GATE_HALF, gate_x + GATE_HALF + 1):
        for gy in range(gate_y - 2, OUT_H - 1):
            if inb(gx, gy):
                G[idx(gx, gy)] = ROAD
    for gy in range(gate_y - 2, OUT_H - 1):
        for lx in (gate_x - GATE_HALF - 1, gate_x + GATE_HALF + 1):
            if inb(lx, gy):
                G[idx(lx, gy)] = GATE_POST

    # South strip: staff parking west, sports ground east
    PARK = (8, 66, 33, 17)
    fill_rect(G, *PARK, PARKING)
    stroke_rect(G, *PARK, SIDEWALK)
    for sx in range(PARK[0] + 3, PARK[0] + PARK[2] - 2, 4):
        for sy in range(PARK[1] + 2, PARK[1] + PARK[3] - 2):
            if inb(sx, sy):
                G[idx(sx, sy)] = SIDEWALK

    PLAY = (46, 66, 27, 17)
    fill_rect(G, *PLAY, FIELD)
    stroke_rect(G, *PLAY, SIDEWALK)

    exteriors = [
        (wing["building"], *wing["shell"], "s", 2, wing["name"]) for wing in WINGS
    ] + [("notice-board", 78, 68, 6, 5, "s", 1, "Notice Board")]

    outdoor_doors: Dict[str, Tuple[int, int]] = {"main-gate": (gate_x, gate_y - 1)}
    facades: List[dict] = []
    for bid, bx, by, bw, bh, door, storeys, label in exteriors:
        outdoor_doors[bid] = stamp_exterior(G, bx, by, bw, bh, SHELL, door)
        facades.append(
            obj(
                0,
                bid,
                bx * TW,
                by * TH,
                bw * TW,
                bh * TH,
                [
                    {"name": "buildingId", "type": "string", "value": bid},
                    {"name": "style", "type": "string", "value": STYLE[bid]},
                    {"name": "doorSide", "type": "string", "value": door},
                    {"name": "storeys", "type": "int", "value": storeys},
                    {"name": "label", "type": "string", "value": label},
                ],
            )
        )

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
    vehicles: List[dict] = []
    props: List[dict] = []
    ambient_objs: List[dict] = []

    chair_gid = next((ts["firstgid"] for ts in tilesets if ts["name"] == "chair"), None)
    chair_up = (chair_gid + 1) if chair_gid else None
    chair_down = (chair_gid + 5) if chair_gid else None

    def add_prop(kind: str, tx: int, ty: int, rot: int = 0):
        nonlocal next_id
        props.append(
            point_obj(
                next_id,
                f"{kind}-{tx}-{ty}",
                tx,
                ty,
                [
                    {"name": "kind", "type": "string", "value": kind},
                    {"name": "rotation", "type": "int", "value": rot},
                ],
            )
        )
        next_id += 1

    def add_chairs(tag: str, rx: int, ry: int, rw: int, rh: int, direction: str, max_rows: int = 2):
        nonlocal next_id
        gid = chair_up if direction == "up" else chair_down
        if not gid:
            return
        for row, ty in enumerate(range(ry + 3, ry + rh - 1, 3)):
            if row >= max_rows:
                break
            for col, tx in enumerate(range(rx + 2, rx + rw - 2, 3)):
                chairs.append(chair_obj(next_id, f"c-{tag}-{row}-{col}", tx, ty, gid, direction))
                next_id += 1

    def add_room(room_id: str, rx: int, ry: int, rw: int, rh: int):
        nonlocal next_id
        rooms.append(room_obj(next_id, room_id, rx, ry, rw, rh))
        next_id += 1

    def add_board(board_id: str, rx: int, ry: int, rw: int):
        nonlocal next_id
        boards.append(board_obj(next_id, board_id, rx + rw // 2 - 1, ry))
        next_id += 1

    def add_desk(tag: str, tx: int, ty: int, gid: int):
        nonlocal next_id
        desks.append(tiled_sprite(next_id, f"desk-{tag}", tx, ty, gid))
        next_id += 1

    def add_classroom(room_id: str, rx: int, ry: int, rw: int, rh: int):
        add_room(room_id, rx, ry, rw, rh)
        add_board(f"board-{room_id}", rx, ry, rw)
        add_desk(room_id, rx + rw // 2, ry + 1, DESK_GIDS[0])
        add_chairs(room_id, rx, ry, rw, rh, "up", max_rows=3)

    def add_ambient(tx: int, ty: int, area_id: str):
        nonlocal next_id
        ambient_objs.append(
            point_obj(
                next_id,
                f"ambient-{len(ambient_objs)}",
                tx,
                ty,
                [
                    {"name": "ambientId", "type": "string", "value": f"ambient-{len(ambient_objs)}"},
                    {"name": "areaId", "type": "string", "value": area_id},
                ],
            )
        )
        next_id += 1

    areas.append(area_obj(next_id, "outdoor", 0, 0, OUT_W, OUT_H, "Campus Grounds"))
    next_id += 1

    # ------------------------------------------------------------------- wings
    wing_floors: Dict[str, Wing] = {}
    reach_targets: Dict[str, List[Tuple[str, Tuple[int, int]]]] = {}

    for spec in WINGS:
        key = spec["key"]
        for floor in ("ground", "first"):
            area_id = spec[floor]
            fx, fy = INT[area_id]
            is_ground = floor == "ground"
            wing = Wing(fx, fy, has_east=is_ground)
            wing.stamp_shell(G, FLOOR[area_id])
            wing_floors[area_id] = wing
            targets: List[Tuple[str, Tuple[int, int]]] = []

            classes = classroom_ids(key, floor)
            floor_name = "Ground Floor" if is_ground else "First Floor"
            label = f"{spec['name']} · {floor_name}"

            # --- north band: classrooms, service rooms, staff room, stairwell
            widths = NORTH_GROUND if is_ground else NORTH_FIRST
            north = cells(wing.mx0, wing.mx1, widths)
            for i, (cx0, cx1) in enumerate(north):
                if i > 0:
                    vwall(G, wing.ny0, wing.ny1, cx0 - 1)
                door_h(G, (cx0 + cx1) // 2, wing.wall_n, FLOOR[area_id])

            n_class = 2 if is_ground else 1
            north_ids = classes[:n_class]
            if is_ground:
                north_ids = north_ids + [f"{key}-prep-room", f"{key}-washrooms", f"{key}-staff-room"]
            else:
                north_ids = north_ids + [spec["hall"], f"{key}-washrooms-upper", f"{key}-staff-room-upper"]

            for room_id, (cx0, cx1) in zip(north_ids, north):
                rw = cx1 - cx0 + 1
                if room_id in classes:
                    add_classroom(room_id, cx0, wing.ny0, rw, NORTH_H)
                else:
                    add_room(room_id, cx0, wing.ny0, rw, NORTH_H)
                    add_desk(room_id, cx0 + rw // 2, wing.ny0 + 2, DESK_GIDS[1])
                    add_chairs(room_id, cx0, wing.ny0, rw, NORTH_H, "down")
                targets.append((room_id, (cx0 + rw // 2, wing.ny0 + NORTH_H // 2)))

            # Stairwell is the last north cell, beside the staff room
            stair_x0, stair_x1 = north[-1]
            wing.stair_tile = ((stair_x0 + stair_x1) // 2, wing.ny0 + NORTH_H // 2)
            add_prop("stairs", wing.stair_tile[0], wing.stair_tile[1])
            targets.append(("stairwell", wing.stair_tile))

            # --- south band
            south_ids = classes[n_class:]
            lab_x0, lab_x1 = wing.mx0, wing.mx0 + LAB_W - 1
            court_x0, court_x1 = lab_x1 + 2, lab_x1 + 1 + COURT_W
            block_x0, block_x1 = court_x1 + 2, wing.mx1

            vwall(G, wing.sy0, wing.sy1, lab_x1 + 1)
            vwall(G, wing.sy0, wing.sy1, court_x1 + 1)

            if is_ground:
                lab_cols = cells(lab_x0, lab_x1, [13, 14])
                hwall(G, lab_x0, lab_x1, wing.sub_wall)
                lab_ids = [
                    [f"{key}-physics-lab", f"{key}-computer-lab"],
                    [f"{key}-biology-lab", f"{key}-chemistry-lab"],
                ]
                sub_rows = [(wing.sy0, wing.sub_wall - 1), (wing.sub_wall + 1, wing.sy1)]
                for c, (cx0, cx1) in enumerate(lab_cols):
                    if c > 0:
                        vwall(G, wing.sy0, wing.sy1, cx0 - 1)
                    rw = cx1 - cx0 + 1
                    for r, (ry0, ry1) in enumerate(sub_rows):
                        room_id = lab_ids[r][c]
                        rh = ry1 - ry0 + 1
                        add_room(room_id, cx0, ry0, rw, rh)
                        add_board(f"board-{room_id}", cx0, ry0, rw)
                        add_desk(room_id, cx0 + rw // 2, ry0 + 1, DESK_GIDS[2])
                        add_chairs(room_id, cx0, ry0, rw, rh, "up", max_rows=1)
                        targets.append((room_id, (cx0 + rw // 2, ry0 + rh // 2)))
                    # back-row labs open off the front row, as a connected suite
                    door_h(G, (cx0 + cx1) // 2, wing.sub_wall, FLOOR[area_id])
                    door_h(G, (cx0 + cx1) // 2, wing.wall_s, FLOOR[area_id])
                # the chemistry lab also opens onto the courtyard
                door_v(G, lab_x1 + 1, sub_rows[1][0] + 1, FLOOR[area_id])

                court_id = f"{key}-small-ground"
                fill_rect(G, court_x0, wing.sy0, COURT_W, SOUTH_H, FIELD)
                add_room(court_id, court_x0, wing.sy0, COURT_W, SOUTH_H)
                for tx in (court_x0 + 3, court_x1 - 3):
                    add_prop("tree", tx, wing.sy0 + 3)
                add_prop("bench", court_x0 + COURT_W // 2, wing.sy1 - 2)
                targets.append((court_id, (court_x0 + COURT_W // 2, wing.sy0 + SOUTH_H // 2)))
            else:
                terrace_id = f"{key}-terrace"
                terrace_w = court_x1 - lab_x0 + 1
                fill_rect(G, lab_x0, wing.sy0, terrace_w, SOUTH_H, PLAZA)
                add_room(terrace_id, lab_x0, wing.sy0, terrace_w, SOUTH_H)
                for tx in range(lab_x0 + 4, court_x1 - 3, 12):
                    add_prop("planter", tx, wing.sy0 + 2)
                add_prop("bench", lab_x0 + terrace_w // 2, wing.sy1 - 2)
                targets.append((terrace_id, (lab_x0 + terrace_w // 2, wing.sy0 + SOUTH_H // 2)))
                door_h(G, (lab_x0 + court_x1) // 2, wing.wall_s, FLOOR[area_id], width=4)

            block = cells(block_x0, block_x1, BLOCK_CELLS)
            for i, (cx0, cx1) in enumerate(block):
                if i > 0:
                    vwall(G, wing.sy0, wing.sy1, cx0 - 1)
                door_h(G, (cx0 + cx1) // 2, wing.wall_s, FLOOR[area_id])
                if i >= len(south_ids):
                    continue
                rw = cx1 - cx0 + 1
                add_classroom(south_ids[i], cx0, wing.sy0, rw, SOUTH_H)
                targets.append((south_ids[i], (cx0 + rw // 2, wing.sy0 + SOUTH_H // 2)))

            if is_ground:
                door_h(G, (court_x0 + court_x1) // 2, wing.wall_s, FLOOR[area_id], width=3)

            # --- east column: reception lobby, library, offices
            if is_ground:
                vwall(G, wing.y0 + 1, wing.y0 + wing.h - 2, wing.east_wall)
                door_v(G, wing.east_wall, wing.cmid, CORRIDOR_GID)
                lobby_x1 = wing.ex0 + 3
                inner_wall = lobby_x1 + 1
                fill_rect(G, wing.ex0, wing.ny0, EAST_W, wing.h - 2, EAST_GID)
                vwall(G, wing.y0 + 1, wing.y0 + wing.h - 2, inner_wall)

                reception_id = f"{key}-reception"
                add_room(reception_id, wing.ex0, wing.ny0, 4, wing.h - 2)
                targets.append((reception_id, (wing.ex0 + 1, wing.cmid)))

                east_ids = [f"{key}-library", spec["east_mid"], spec["east_bottom"]]
                east_rows = cells(wing.ny0, wing.y0 + wing.h - 2, EAST_ROWS)
                for i, (ry0, ry1) in enumerate(east_rows):
                    if i > 0:
                        hwall(G, inner_wall, wing.ex1, ry0 - 1)
                    door_v(G, inner_wall, (ry0 + ry1) // 2, EAST_GID)
                    rh = ry1 - ry0 + 1
                    rw = wing.ex1 - inner_wall
                    add_room(east_ids[i], inner_wall + 1, ry0, rw, rh)
                    add_desk(east_ids[i], inner_wall + 1 + rw // 2, ry0 + 1, DESK_GIDS[1])
                    add_chairs(east_ids[i], inner_wall + 1, ry0, rw, rh, "down", max_rows=1)
                    targets.append((east_ids[i], (inner_wall + 1 + rw // 2, ry0 + rh // 2)))
                add_board(f"board-{key}-reception", wing.ex0, wing.ny0, 4)

            areas.append(
                area_obj(next_id, area_id, fx - 2, fy - 1, wing.w + 4, wing.h + 2, label)
            )
            next_id += 1

            add_ambient(wing.mx0 + 12, wing.cmid, area_id)
            add_ambient(wing.mx0 + 46, wing.cmid, area_id)
            add_ambient(wing.mx0 + 80, wing.cmid, area_id)

            reach_targets[area_id] = targets

    # ------------------------------------------------------ portals between areas
    for spec in WINGS:
        building_id = spec["building"]
        ground = wing_floors[spec["ground"]]
        upper = wing_floors[spec["first"]]
        odx, ody = outdoor_doors[building_id]

        portals.append(
            portal_obj(
                next_id,
                f"enter-{building_id}",
                odx,
                ody,
                spec["ground"],
                ground.entry_tile[0],
                ground.entry_tile[1],
                f"Enter {spec['name']}",
            )
        )
        next_id += 1
        portals.append(
            portal_obj(
                next_id,
                f"exit-{spec['ground']}",
                ground.exit_tile[0],
                ground.exit_tile[1],
                "outdoor",
                odx,
                ody + 1,
                "Exit to Campus",
                tw=2,
                th=CORR_H + 2,
            )
        )
        next_id += 1
        portals.append(
            portal_obj(
                next_id,
                f"stairs-up-{spec['key']}",
                ground.stair_tile[0],
                ground.stair_tile[1],
                spec["first"],
                upper.stair_tile[0],
                upper.cy0 + 1,
                "Go Upstairs",
                tw=3,
                th=3,
            )
        )
        next_id += 1
        portals.append(
            portal_obj(
                next_id,
                f"stairs-down-{spec['key']}",
                upper.stair_tile[0],
                upper.stair_tile[1],
                spec["ground"],
                ground.stair_tile[0],
                ground.cy0 + 1,
                "Go Downstairs",
                tw=3,
                th=3,
            )
        )
        next_id += 1

    # -------------------------------------------------------- outdoor triggers
    outdoor_only = {
        "walking-area": (WALK[0] + WALK[2] // 2, WALK[1] + WALK[3] + 1),
        "parking": (PARK[0] + PARK[2] // 2, PARK[1] - 2),
        "playground": (PLAY[0] + PLAY[2] // 2, PLAY[1] - 2),
    }
    for bid, (dx, dy) in {**outdoor_doors, **outdoor_only}.items():
        buildings.append(building_door_obj(next_id, bid, dx, dy))
        next_id += 1

    # ------------------------------------------------------- outdoor dressing
    for ty in range(10, gate_y, 3):
        add_prop("dash", DRIVE_X, ty, 90)
    for tx in range(12, DRIVE_X, 3):
        add_prop("dash", tx, 6)
        add_prop("dash", tx, 32)
        add_prop("dash", tx, 60)
    for tx in range(12, 112, 3):
        add_prop("dash", tx, 86)

    add_prop("goal", PLAY[0] + 4, PLAY[1] + PLAY[3] // 2)
    add_prop("goal", PLAY[0] + PLAY[2] - 5, PLAY[1] + PLAY[3] // 2)
    add_prop("swing", PLAY[0] + PLAY[2] // 2 - 5, PLAY[1] + 4)
    add_prop("slide", PLAY[0] + PLAY[2] // 2 + 4, PLAY[1] + 4)
    add_prop("sandpit", PLAY[0] + PLAY[2] // 2, PLAY[1] + PLAY[3] - 4)
    add_prop("sign-parking", PARK[0] + PARK[2] // 2, PARK[1] - 1)
    add_prop("flagpole", DRIVE_X - 8, 66)
    for bx_ in (DRIVE_X - 10, DRIVE_X + 10):
        add_prop("bin", bx_, 80)

    walk_mid = WALK[0] + WALK[2] // 2
    for wy in range(WALK[1] + 8, WALK[1] + WALK[3] - 8, 10):
        add_prop("bench", walk_mid - 4, wy)
        add_prop("tree", walk_mid + 5, wy + 3)
        add_prop("lamp", walk_mid, wy + 6)

    # Street lamps flanking the main drive and the two cross drives
    for ty in range(12, gate_y - 2, 10):
        add_prop("lamp", DRIVE_X - 4, ty)
        add_prop("lamp", DRIVE_X + 4, ty)
    for tx in range(16, DRIVE_X - 6, 14):
        add_prop("lamp", tx, 29)
        add_prop("lamp", tx, 57)

    # -------------------------------------------------------------------- car
    car_tile = (PARK[0] + 5, PARK[1] + 5)
    vehicles.append(
        point_obj(
            next_id,
            "campus-car",
            car_tile[0],
            car_tile[1],
            [
                {"name": "vehicleId", "type": "string", "value": "campus-car"},
                {"name": "areaId", "type": "string", "value": "outdoor"},
            ],
        )
    )
    next_id += 1

    # ----------------------------------------------------------------- people
    a_door = outdoor_doors["a-level-block"]
    o_door = outdoor_doors["o-level-block"]
    npc_places = {
        "npc-senior": (gate_x - 6, gate_y - 4),
        "npc-teacher": (a_door[0] - 4, a_door[1] + 1),
        "npc-clerk": (o_door[0] - 4, o_door[1] + 1),
        "npc-librarian": (walk_mid, WALK[1] + WALK[3] - 4),
        "npc-lab": (PLAY[0] + PLAY[2] // 2, PLAY[1] - 3),
    }
    for nid, (nx, ny) in npc_places.items():
        npcs.append(point_obj(next_id, nid, nx, ny, [{"name": "npcId", "type": "string", "value": nid}]))
        next_id += 1

    for tx, ty in ((DRIVE_X - 12, 40), (DRIVE_X - 20, 70), (walk_mid, WALK[1] + 20)):
        add_ambient(tx, ty, "outdoor")

    spawn_tx, spawn_ty = gate_x, gate_y - 2
    G[idx(spawn_tx, spawn_ty)] = ROAD
    spawns = [obj(next_id, "spawn_gate", spawn_tx * TW + TW // 2, spawn_ty * TH + TH // 2, 0, 0)]
    next_id += 1

    if chair_down:
        bench_spots = [(DRIVE_X - 12, 66), (DRIVE_X + 4, 66), (PLAY[0] - 3, PLAY[1] + 5)]
        for i, (chx, chy) in enumerate(bench_spots):
            chairs.append(chair_obj(next_id, f"bench-{i}", chx, chy, chair_down, "down"))
            next_id += 1

    # ------------------------------------------------------------------- eggs
    a_ground = wing_floors["a-level-ground"]
    o_ground = wing_floors["o-level-ground"]
    a_east_rows = cells(a_ground.ny0, a_ground.y0 + a_ground.h - 2, EAST_ROWS)
    o_east_rows = cells(o_ground.ny0, o_ground.y0 + o_ground.h - 2, EAST_ROWS)
    a_inner = a_ground.ex0 + 4
    o_inner = o_ground.ex0 + 4
    egg_spots = [
        ("cq-gate-start", gate_x + 5, gate_y - 5),
        ("cq-forms-desk", a_inner + 5, a_east_rows[1][0] + 4),
        ("cq-library-quiet", a_inner + 5, a_east_rows[0][0] + 5),
        ("cq-fee-hours", PARK[0] + PARK[2] - 4, PARK[1] + 3),
        ("cq-lab-rule", a_ground.mx0 + 6, a_ground.sy0 + 2),
        ("cq-canteen-manners", o_inner + 5, o_east_rows[2][0] + 3),
    ]
    eggs = []
    for eid, etx, ety in egg_spots:
        eggs.append(point_obj(next_id, eid, etx, ety, [{"name": "eggId", "type": "string", "value": eid}]))
        next_id += 1

    # --------------------------------------------------------- reachability
    problems: List[str] = []
    outdoor_reach = flood(G, colliding, (spawn_tx, spawn_ty), 0, 0, OUT_W - 1, OUT_H - 1)
    for bid, (dx, dy) in {**outdoor_doors, **outdoor_only}.items():
        if (dx, dy) not in outdoor_reach:
            problems.append(f"outdoor trigger '{bid}' at ({dx},{dy}) is unreachable from the gate")
    if (car_tile[0], car_tile[1]) not in outdoor_reach:
        problems.append("the campus car is parked on an unreachable tile")

    for area_id, targets in reach_targets.items():
        wing = wing_floors[area_id]
        reach = flood(
            G,
            colliding,
            wing.entry_tile,
            wing.x0 - 1,
            wing.y0,
            wing.x0 + wing.w - 1,
            wing.y0 + wing.h - 1,
        )
        for room_id, tile in targets:
            if tile not in reach:
                problems.append(f"{area_id}: '{room_id}' centre {tile} is walled off from the entrance")
        if wing.exit_tile not in reach:
            problems.append(f"{area_id}: the campus exit is walled off")
    if problems:
        raise SystemExit("Layout is not walkable:\n  - " + "\n  - ".join(problems))

    for bucket in (
        portals,
        areas,
        rooms,
        boards,
        chairs,
        desks,
        decor,
        buildings,
        npcs,
        ambient_objs,
        spawns,
        eggs,
        vehicles,
        facades,
        props,
    ):
        for item in bucket:
            item["id"] = next_id
            next_id += 1

    def objectgroup(lid: int, name: str, objects: List[dict]) -> dict:
        return {
            "id": lid,
            "name": name,
            "type": "objectgroup",
            "draworder": "topdown",
            "x": 0,
            "y": 0,
            "opacity": 1,
            "visible": True,
            "objects": objects,
        }

    layers: List[dict] = [
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
        }
    ]
    lid = 2
    for name, bucket in (
        ("spawns", spawns),
        ("areas", areas),
        ("portals", portals),
        ("buildings", buildings),
        ("rooms", rooms),
        ("boards", boards),
        ("npcs", npcs),
        ("ambient", ambient_objs),
        ("eggs", eggs),
        ("vehicles", vehicles),
        ("facades", facades),
        ("props", props),
        ("Chair", chairs),
        ("Objects", decor),
        ("ObjectsOnCollide", desks),
    ):
        layers.append(objectgroup(lid, name, bucket))
        lid += 1
    for name in ("Wall", "GenericObjects", "GenericObjectsOnCollide", "Basement", "VendingMachine", "benches"):
        layers.append(objectgroup(lid, name, []))
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
                "value": "Excalidraw-derived campus: two long 2-storey wings + interior floor islands. tools/gen_lgs_campus.py",
            }
        ],
    }

    os.makedirs(MAPS_DIR, exist_ok=True)
    for path in (OUT_MAP, OUT_CAMPUS):
        with open(path, "w") as f:
            json.dump(out, f, separators=(",", ":"))
        print(f"Wrote {path}")

    classroom_count = sum(
        len(classroom_ids(spec["key"], floor)) for spec in WINGS for floor in ("ground", "first")
    )
    print(
        f"Size {W}x{H} | classrooms={classroom_count} rooms={len(rooms)} boards={len(boards)} "
        f"portals={len(portals)} areas={len(areas)} chairs={len(chairs)} eggs={len(eggs)} cars={len(vehicles)}"
    )


if __name__ == "__main__":
    main()
