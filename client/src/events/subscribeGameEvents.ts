import store from '../stores'
import { phaserEvents, Event } from './EventCenter'
import { openBuilding } from '../stores/BuildingStore'
import { openNpc } from '../stores/NpcStore'
import { openRoom } from '../stores/RoomInfoStore'
import { completeQuestStepIfMatch, startQuestIfNeeded, toggleQuestLog } from '../stores/QuestStore'
import { getNpcById } from '../content/npcs'

/**
 * The one subscription module described in AGENTS.md / docs/ARCHITECTURE.md: Phaser
 * (BuildingZone, PortalZone, NpcZone, RoomZone, BoardZone) only ever emits typed events on `phaserEvents`; this module is
 * the sole place that turns those events into Redux dispatches (portal enter stays in Phaser — teleport + camera). Imported once from
 * `index.tsx` after the store exists.
 */
export function subscribeGameEvents() {
  phaserEvents.on(Event.BUILDING_INTERACT, (buildingId: string) => {
    store.dispatch(openBuilding(buildingId))
    completeQuestStepIfMatch(store.dispatch, 'building', buildingId)
  })

  phaserEvents.on(Event.ROOM_INTERACT, (roomId: string) => {
    store.dispatch(openRoom(roomId))
  })

  // Classroom whiteboards open the same fullscreen campus notice board (shared pins)
  phaserEvents.on(Event.BOARD_INTERACT, () => {
    store.dispatch(openBuilding('notice-board'))
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
