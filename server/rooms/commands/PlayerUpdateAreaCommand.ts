import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { ICampusState } from '../../../types/ICampusState'

/** Mirrors client/src/content/areas.ts — one entry per camera-bounded area. */
const ALLOWED_AREAS = new Set([
  'outdoor',
  'a-level-ground',
  'a-level-first',
  'o-level-ground',
  'o-level-first',
])

type Payload = {
  client: Client
  areaId: string
}

export default class PlayerUpdateAreaCommand extends Command<ICampusState, Payload> {
  execute(data: Payload) {
    const { client, areaId } = data
    const player = this.room.state.players.get(client.sessionId)
    if (!player) return
    if (!ALLOWED_AREAS.has(areaId)) return
    player.areaId = areaId
  }
}
