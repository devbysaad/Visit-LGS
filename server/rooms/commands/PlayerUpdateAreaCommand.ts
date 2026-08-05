import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { ICampusState } from '../../../types/ICampusState'

const ALLOWED_AREAS = new Set(['outdoor', 'library', 'classrooms', 'admin', 'canteen'])

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
