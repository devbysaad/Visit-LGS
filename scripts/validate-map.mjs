#!/usr/bin/env node
/**
 * Standalone map/content validator — a plain-Node mirror of
 * client/src/utils/validateMapContent.ts, for running in CI or from the
 * command line without booting Phaser. See docs/MAP_SPEC.md for the contract.
 *
 * Usage: node scripts/validate-map.mjs
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const MAP_PATH = path.join(root, 'client/public/assets/map/map.json')
const BUILDINGS_TS = path.join(root, 'client/src/content/buildings.ts')
const NPCS_TS = path.join(root, 'client/src/content/npcs.ts')
const QUESTS_TS = path.join(root, 'client/src/content/quests.ts')
const ROOMS_TS = path.join(root, 'client/src/content/rooms.ts')

/** Extracts `id: 'foo-bar'` style string literals from a content/*.ts file. */
function extractIds(source) {
  const ids = new Set()
  const pattern = /\bid:\s*['"]([a-z0-9-]+)['"]/gi
  let match
  while ((match = pattern.exec(source))) {
    ids.add(match[1])
  }
  return ids
}

/**
 * rooms.ts builds its 30 classrooms from a `[id, name, block, floor]` tuple table
 * rather than 30 object literals, so pick those ids up too.
 */
function extractTupleIds(source) {
  const ids = new Set()
  const pattern = /\[\s*['"]([a-z0-9-]+)['"]\s*,\s*['"][^'"]+['"]\s*,/gi
  let match
  while ((match = pattern.exec(source))) {
    ids.add(match[1])
  }
  return ids
}

/** Extracts `{ targetType: 'building', targetId: 'foo' }`-ish pairs from quests.ts. */
function extractQuestTargets(source) {
  const targets = []
  const pattern = /targetType:\s*['"](building|npc)['"][^}]*?targetId:\s*['"]([a-z0-9-]+)['"]/gis
  let match
  while ((match = pattern.exec(source))) {
    targets.push({ targetType: match[1], targetId: match[2] })
  }
  return targets
}

function getStringProperty(object, propertyName) {
  const properties = object.properties ?? []
  const match = properties.find((property) => property.name === propertyName)
  return typeof match?.value === 'string' ? match.value : undefined
}

function main() {
  const errors = []
  const warnings = []

  const map = JSON.parse(readFileSync(MAP_PATH, 'utf-8'))
  const buildingIds = extractIds(readFileSync(BUILDINGS_TS, 'utf-8'))
  const npcIds = extractIds(readFileSync(NPCS_TS, 'utf-8'))
  const roomsSource = readFileSync(ROOMS_TS, 'utf-8')
  const roomIds = new Set([...extractIds(roomsSource), ...extractTupleIds(roomsSource)])
  const questTargets = extractQuestTargets(readFileSync(QUESTS_TS, 'utf-8'))

  const getLayer = (name) => map.layers.find((layer) => layer.name === name)

  const spawnsLayer = getLayer('spawns')
  if (!spawnsLayer) {
    errors.push('Map is missing the "spawns" object layer.')
  } else {
    const spawnGates = spawnsLayer.objects.filter(
      (object) => object.name === 'spawn_gate' || getStringProperty(object, 'name') === 'spawn_gate'
    )
    if (spawnGates.length === 0) errors.push('Map "spawns" layer is missing a "spawn_gate" object.')
    else if (spawnGates.length > 1)
      warnings.push(`Map "spawns" layer has ${spawnGates.length} "spawn_gate" objects; expected exactly 1.`)
  }

  const buildingsLayer = getLayer('buildings')
  const mapBuildingIds = new Set()
  if (!buildingsLayer) {
    errors.push('Map is missing the "buildings" object layer.')
  } else {
    buildingsLayer.objects.forEach((object) => {
      const buildingId = getStringProperty(object, 'buildingId')
      if (!buildingId) {
        errors.push(`Map building object "${object.name || object.id}" is missing a "buildingId" property.`)
        return
      }
      mapBuildingIds.add(buildingId)
      if (!buildingIds.has(buildingId)) {
        errors.push(`Map building object "${object.name || object.id}" references unknown buildingId "${buildingId}".`)
      }
    })
  }
  buildingIds.forEach((id) => {
    if (!mapBuildingIds.has(id)) warnings.push(`Content building "${id}" has no matching object in the map.`)
  })

  const roomsLayer = getLayer('rooms')
  const mapRoomIds = new Set()
  if (!roomsLayer) {
    warnings.push('Map is missing the "rooms" object layer.')
  } else {
    roomsLayer.objects.forEach((object) => {
      const roomId = getStringProperty(object, 'roomId')
      if (!roomId) {
        errors.push(`Map room object "${object.name || object.id}" is missing a "roomId" property.`)
        return
      }
      mapRoomIds.add(roomId)
      if (!roomIds.has(roomId)) {
        errors.push(`Map room object "${object.name || object.id}" references unknown roomId "${roomId}".`)
      }
    })
  }
  roomIds.forEach((id) => {
    if (!mapRoomIds.has(id)) warnings.push(`Content room "${id}" has no matching object in the map.`)
  })

  const npcsLayer = getLayer('npcs')
  const mapNpcIds = new Set()
  if (!npcsLayer) {
    errors.push('Map is missing the "npcs" object layer.')
  } else {
    npcsLayer.objects.forEach((object) => {
      const npcId = getStringProperty(object, 'npcId')
      if (!npcId) {
        errors.push(`Map npc object "${object.name || object.id}" is missing an "npcId" property.`)
        return
      }
      mapNpcIds.add(npcId)
      if (!npcIds.has(npcId)) {
        errors.push(`Map npc object "${object.name || object.id}" references unknown npcId "${npcId}".`)
      }
    })
  }
  npcIds.forEach((id) => {
    if (!mapNpcIds.has(id)) warnings.push(`Content npc "${id}" has no matching object in the map.`)
  })

  questTargets.forEach(({ targetType, targetId }) => {
    if (targetType === 'building') {
      if (!buildingIds.has(targetId)) errors.push(`Quest step targets unknown building "${targetId}".`)
      else if (!mapBuildingIds.has(targetId))
        errors.push(`Quest step targets building "${targetId}" which is not placed on the map.`)
    } else if (targetType === 'npc') {
      if (!npcIds.has(targetId)) errors.push(`Quest step targets unknown npc "${targetId}".`)
      else if (!mapNpcIds.has(targetId))
        errors.push(`Quest step targets npc "${targetId}" which is not placed on the map.`)
    }
  })

  function getNumberProperty(object, propertyName) {
    const properties = object.properties ?? []
    const match = properties.find((property) => property.name === propertyName)
    return typeof match?.value === 'number' ? match.value : undefined
  }

  const areasLayer = getLayer('areas')
  const mapAreaIds = new Set()
  if (!areasLayer) {
    errors.push('Map is missing the "areas" object layer.')
  } else {
    areasLayer.objects.forEach((object) => {
      const areaId = getStringProperty(object, 'areaId')
      if (!areaId) {
        errors.push(`Map area object "${object.name || object.id}" is missing "areaId".`)
        return
      }
      mapAreaIds.add(areaId)
    })
    if (!mapAreaIds.has('outdoor')) errors.push('Map "areas" layer must include areaId "outdoor".')
  }

  const portalsLayer = getLayer('portals')
  if (!portalsLayer) {
    errors.push('Map is missing the "portals" object layer.')
  } else {
    portalsLayer.objects.forEach((object) => {
      const portalId = getStringProperty(object, 'portalId')
      const targetArea = getStringProperty(object, 'targetArea')
      const spawnTileX = getNumberProperty(object, 'spawnTileX')
      const spawnTileY = getNumberProperty(object, 'spawnTileY')
      if (!portalId) errors.push(`Map portal "${object.name || object.id}" is missing "portalId".`)
      if (!targetArea) errors.push(`Map portal "${object.name || object.id}" is missing "targetArea".`)
      else if (areasLayer && !mapAreaIds.has(targetArea))
        errors.push(`Map portal "${object.name || object.id}" targets unknown area "${targetArea}".`)
      if (spawnTileX === undefined || spawnTileY === undefined)
        errors.push(`Map portal "${object.name || object.id}" needs spawnTileX and spawnTileY.`)
    })
  }

  warnings.forEach((warning) => console.warn(`[validate-map] WARN: ${warning}`))
  errors.forEach((error) => console.error(`[validate-map] ERROR: ${error}`))

  console.log(
    `\n[validate-map] ${errors.length} error(s), ${warnings.length} warning(s). ` +
      `Buildings: ${mapBuildingIds.size}/${buildingIds.size} on map. ` +
      `Rooms: ${mapRoomIds.size}/${roomIds.size} on map. ` +
      `NPCs: ${mapNpcIds.size}/${npcIds.size} on map. ` +
      `Areas: ${mapAreaIds.size}. Portals: ${portalsLayer?.objects?.length ?? 0}.`
  )

  if (errors.length > 0) {
    process.exitCode = 1
  }
}

main()
