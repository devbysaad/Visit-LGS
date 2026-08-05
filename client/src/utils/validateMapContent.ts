import Phaser from 'phaser'
import { buildings } from '../content/buildings'
import { npcs } from '../content/npcs'
import { quests } from '../content/quests'
import { rooms } from '../content/rooms'

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

export function getNumberProperty(
  object: Phaser.Types.Tilemaps.TiledObject,
  propertyName: string
): number | undefined {
  const properties = (object.properties ?? []) as Array<{ name: string; value: unknown }>
  const match = properties.find((property) => property.name === propertyName)
  return typeof match?.value === 'number' ? match.value : undefined
}

/**
 * Validates that every Tiled `buildings`/`npcs`/`rooms` object references an id that exists in
 * content. See docs/MAP_SPEC.md for the contract.
 */
export function validateMapContent(map: Phaser.Tilemaps.Tilemap): MapValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const buildingIds = new Set(buildings.map((building) => building.id))
  const npcIds = new Set(npcs.map((npc) => npc.id))
  const roomIds = new Set(rooms.map((room) => room.id))

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

  buildingIds.forEach((buildingId) => {
    if (!mapBuildingIds.has(buildingId)) {
      warnings.push(`Content building "${buildingId}" has no matching object in the map "buildings" layer.`)
    }
  })

  const roomsLayer = map.getObjectLayer('rooms')
  const mapRoomIds = new Set<string>()
  if (!roomsLayer) {
    warnings.push('Map is missing the "rooms" object layer (enterable interiors).')
  } else {
    roomsLayer.objects.forEach((object) => {
      const roomId = getStringProperty(object, 'roomId')
      if (!roomId) {
        errors.push(`Map room object "${object.name || object.id}" is missing a "roomId" property.`)
        return
      }
      mapRoomIds.add(roomId)
      if (!roomIds.has(roomId)) {
        errors.push(
          `Map room object "${object.name || object.id}" references unknown roomId "${roomId}". Add it to client/src/content/rooms.ts.`
        )
      }
    })
  }

  roomIds.forEach((roomId) => {
    if (!mapRoomIds.has(roomId)) {
      warnings.push(`Content room "${roomId}" has no matching object in the map "rooms" layer.`)
    }
  })

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

  const areasLayer = map.getObjectLayer('areas')
  const mapAreaIds = new Set<string>()
  if (!areasLayer) {
    errors.push('Map is missing the "areas" object layer (camera bounds per outdoor/interior).')
  } else {
    areasLayer.objects.forEach((object) => {
      const areaId = getStringProperty(object, 'areaId')
      if (!areaId) {
        errors.push(`Map area object "${object.name || object.id}" is missing an "areaId" property.`)
        return
      }
      mapAreaIds.add(areaId)
    })
    if (!mapAreaIds.has('outdoor')) {
      errors.push('Map "areas" layer must include an areaId "outdoor".')
    }
  }

  const portalsLayer = map.getObjectLayer('portals')
  if (!portalsLayer) {
    errors.push('Map is missing the "portals" object layer (enter/exit building interiors).')
  } else {
    portalsLayer.objects.forEach((object) => {
      const portalId = getStringProperty(object, 'portalId')
      const targetArea = getStringProperty(object, 'targetArea')
      const spawnTileX = getNumberProperty(object, 'spawnTileX')
      const spawnTileY = getNumberProperty(object, 'spawnTileY')
      if (!portalId) {
        errors.push(`Map portal "${object.name || object.id}" is missing "portalId".`)
      }
      if (!targetArea) {
        errors.push(`Map portal "${object.name || object.id}" is missing "targetArea".`)
      } else if (areasLayer && !mapAreaIds.has(targetArea)) {
        errors.push(
          `Map portal "${object.name || object.id}" targets unknown area "${targetArea}".`
        )
      }
      if (spawnTileX === undefined || spawnTileY === undefined) {
        errors.push(
          `Map portal "${object.name || object.id}" needs numeric spawnTileX and spawnTileY.`
        )
      }
    })
  }

  return { errors, warnings }
}

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
