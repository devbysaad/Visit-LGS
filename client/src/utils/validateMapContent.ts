import Phaser from 'phaser'
import { buildings } from '../content/buildings'
import { npcs } from '../content/npcs'
import { quests } from '../content/quests'

export interface MapValidationResult {
  errors: string[]
  warnings: string[]
}

export function getStringProperty(
  object: Phaser.Types.Tilemaps.TiledObject,
  propertyName: string
): string | undefined {
  const properties = (object.properties ?? []) as Array<{ name: string; value: unknown }>
  const match = properties.find((property) => property.name === propertyName)
  return typeof match?.value === 'string' ? match.value : undefined
}

/**
 * Validates that every Tiled `buildings`/`npcs` object references an id that exists in
 * content, that every content building/npc has a corresponding map object, and that every
 * quest target resolves to real content. See docs/MAP_SPEC.md for the contract.
 */
export function validateMapContent(map: Phaser.Tilemaps.Tilemap): MapValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const buildingIds = new Set(buildings.map((building) => building.id))
  const npcIds = new Set(npcs.map((npc) => npc.id))

  // spawns: exactly one spawn_gate required
  const spawnsLayer = map.getObjectLayer('spawns')
  if (!spawnsLayer) {
    errors.push('Map is missing the "spawns" object layer.')
  } else {
    const spawnGates = spawnsLayer.objects.filter(
      (object) => object.name === 'spawn_gate' || getStringProperty(object, 'name') === 'spawn_gate'
    )
    if (spawnGates.length === 0) {
      errors.push('Map "spawns" layer is missing a "spawn_gate" object.')
    } else if (spawnGates.length > 1) {
      warnings.push(`Map "spawns" layer has ${spawnGates.length} "spawn_gate" objects; expected exactly 1.`)
    }
  }

  // buildings: every map object must reference a valid buildingId
  const buildingsLayer = map.getObjectLayer('buildings')
  const mapBuildingIds = new Set<string>()
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
        errors.push(
          `Map building object "${object.name || object.id}" references unknown buildingId "${buildingId}". Add it to client/src/content/buildings.ts.`
        )
      }
    })
  }

  // every content building should exist somewhere on the map (loud warning, not fatal)
  buildingIds.forEach((buildingId) => {
    if (!mapBuildingIds.has(buildingId)) {
      warnings.push(`Content building "${buildingId}" has no matching object in the map "buildings" layer.`)
    }
  })

  // npcs: every map object must reference a valid npcId
  const npcsLayer = map.getObjectLayer('npcs')
  const mapNpcIds = new Set<string>()
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
        errors.push(
          `Map npc object "${object.name || object.id}" references unknown npcId "${npcId}". Add it to client/src/content/npcs.ts.`
        )
      }
    })
  }

  npcIds.forEach((npcId) => {
    if (!mapNpcIds.has(npcId)) {
      warnings.push(`Content npc "${npcId}" has no matching object in the map "npcs" layer.`)
    }
  })

  // quest targets must resolve to real content (and, for buildings, real map objects)
  quests.forEach((quest) => {
    quest.steps.forEach((step) => {
      if (step.targetType === 'building') {
        if (!buildingIds.has(step.targetId)) {
          errors.push(
            `Quest "${quest.id}" step "${step.id}" targets unknown building "${step.targetId}".`
          )
        } else if (!mapBuildingIds.has(step.targetId)) {
          errors.push(
            `Quest "${quest.id}" step "${step.id}" targets building "${step.targetId}" which is not placed on the map.`
          )
        }
      } else if (step.targetType === 'npc') {
        if (!npcIds.has(step.targetId)) {
          errors.push(`Quest "${quest.id}" step "${step.id}" targets unknown npc "${step.targetId}".`)
        } else if (!mapNpcIds.has(step.targetId)) {
          errors.push(
            `Quest "${quest.id}" step "${step.id}" targets npc "${step.targetId}" which is not placed on the map.`
          )
        }
      }
    })
  })

  return { errors, warnings }
}

/**
 * Runs validation and logs results. Throws in DEV so mismatches fail loudly (per
 * docs/MAP_SPEC.md); only warns in production so a bad deploy doesn't hard-crash players.
 */
export function runMapContentValidation(map: Phaser.Tilemaps.Tilemap): MapValidationResult {
  const result = validateMapContent(map)

  result.warnings.forEach((warning) => console.warn(`[validateMapContent] ${warning}`))
  result.errors.forEach((error) => console.error(`[validateMapContent] ${error}`))

  if (result.errors.length > 0) {
    const message = `Map/content validation failed with ${result.errors.length} error(s). See console for details.`
    if (import.meta.env.DEV) {
      throw new Error(message)
    } else {
      console.error(message)
    }
  }

  return result
}
