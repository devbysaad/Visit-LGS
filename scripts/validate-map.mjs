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

  warnings.forEach((warning) => console.warn(`[validate-map] WARN: ${warning}`))
  errors.forEach((error) => console.error(`[validate-map] ERROR: ${error}`))

  console.log(
    `\n[validate-map] ${errors.length} error(s), ${warnings.length} warning(s). ` +
      `Buildings: ${mapBuildingIds.size}/${buildingIds.size} on map. NPCs: ${mapNpcIds.size}/${npcIds.size} on map.`
  )

  if (errors.length > 0) {
    process.exitCode = 1
  }
}

main()
