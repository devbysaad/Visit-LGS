import store from '../stores'
import { phaserEvents, Event } from './EventCenter'
import { openBuilding } from '../stores/BuildingStore'
import { openNpc } from '../stores/NpcStore'
import { openRoom } from '../stores/RoomInfoStore'
import { completeQuestStepIfMatch, startQuestIfNeeded, toggleQuestLog } from '../stores/QuestStore'
import { getNpcById } from '../content/npcs'
import phaserGame from '../PhaserGame'
import CampusScene from '../scenes/CampusScene'

/**
 * Phaser zones emit events here; this module alone dispatches Redux / network calls.
 */
export function subscribeGameEvents() {
  phaserEvents.on(Event.BUILDING_INTERACT, (buildingId: string) => {
    store.dispatch(openBuilding(buildingId))
    completeQuestStepIfMatch(store.dispatch, 'building', buildingId)
  })

  phaserEvents.on(Event.ROOM_INTERACT, (roomId: string) => {
    store.dispatch(openRoom(roomId))
  })

  phaserEvents.on(Event.BOARD_INTERACT, () => {
    store.dispatch(openBuilding('notice-board'))
  })

  phaserEvents.on(Event.EGG_INTERACT, (eggId: string) => {
    const scene = phaserGame.scene.keys.game as CampusScene | undefined
    scene?.network.approachEgg(eggId)
  })

  phaserEvents.on(Event.NPC_INTERACT, (npcId: string) => {
    store.dispatch(openNpc(npcId))

    const npc = getNpcById(npcId)
    if (npc?.questHook?.toLowerCase().startsWith('start')) {
      startQuestIfNeeded(store.dispatch)
    }
  })

  phaserEvents.on(Event.QUEST_LOG_TOGGLE, () => {
    store.dispatch(toggleQuestLog())
  })
}
