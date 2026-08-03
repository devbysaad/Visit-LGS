# Assets — CampusQuest

Inventory and licence notes. Update this file whenever assets are added.

## Licence-clearance tasks (do early)

| Asset | Action | Status |
| --- | --- | --- |
| LimeZu tilesets (via SkyOffice fork) | Confirm itch.io licence allows this school project; keep attribution in README | **Open** |
| SkyOffice code | MIT — retain copyright notice | Required |
| Real campus photographs | Written permission if students are identifiable; prefer empty corridors / exteriors | **Open** |
| LGS logo | Use only with school permission; store under `assets/ui/` | **Open** |

## Expected inventory (after Phase 1–2)

### Tilesets

| Path | Source | Attribution |
| --- | --- | --- |
| `client/public/assets/tilesets/*` | LimeZu / SkyOffice | LimeZu — verify licence |

### Characters

| Path | Source | Notes |
| --- | --- | --- |
| `client/public/assets/characters/*` | SkyOffice / LimeZu | Avatar select grid |

### Maps

| Path | Source | Notes |
| --- | --- | --- |
| `client/public/assets/maps/campus.tmx` | Project | Authoring |
| `client/public/assets/maps/campus.json` | Export | Runtime |

### Building photos

| Path | Source | Notes |
| --- | --- | --- |
| `client/public/assets/images/buildings/{id}.jpg` | School photos | Match CONTENT.md ids |

### UI

| Path | Source | Notes |
| --- | --- | --- |
| LGS logo | School | Join screen |
| UI atlas (if any) | Project / fork | |

## Audio (Phase 6, muted by default)

| Clip | Use |
| --- | --- |
| Ambient loop | Soft campus bed |
| Interact blip | E confirm |
| Quest complete | Short stinger |

Prefer CC0 or properly licensed packs; list licence here when added.

## Naming

- Building photos: `{buildingId}.jpg` matching content ids
- Do not commit huge raw camera dumps — compress for web
