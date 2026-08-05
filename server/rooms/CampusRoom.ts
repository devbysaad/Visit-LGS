import { Room, Client } from 'colyseus'
import { Dispatcher } from '@colyseus/command'
import { Player, CampusState } from './schema/CampusState'
import { Message } from '../../types/Messages'
import { IRoomData } from '../../types/Rooms'
import PlayerUpdateCommand from './commands/PlayerUpdateCommand'
import PlayerUpdateNameCommand from './commands/PlayerUpdateNameCommand'
import PlayerUpdateAreaCommand from './commands/PlayerUpdateAreaCommand'
import ChatMessageUpdateCommand from './commands/ChatMessageUpdateCommand'
import NoticePostUpdateCommand from './commands/NoticePostUpdateCommand'
import { hydrateNoticePost, loadNoticePosts } from '../noticeBoardStore'

/** Mirror client moderation — keep posts short for a school board. */
const MAX_NOTICE_LENGTH = 280

function sanitizeNoticeContent(raw: string): string {
  return raw.trim().slice(0, MAX_NOTICE_LENGTH)
}

export class CampusRoom extends Room<CampusState> {
  private dispatcher = new Dispatcher(this)
  private name: string
  private description: string

  async onCreate(options: IRoomData) {
    const { name, description, autoDispose } = options
    this.name = name
    this.description = description
    this.autoDispose = autoDispose
    this.setMetadata({ name, description })

    this.setState(new CampusState())

    // Restore shared notice-board posts so later joiners still see them.
    for (const saved of loadNoticePosts()) {
      this.state.noticePosts.push(hydrateNoticePost(saved))
    }

    this.onMessage(
      Message.UPDATE_PLAYER,
      (client, message: { x: number; y: number; anim: string }) => {
        this.dispatcher.dispatch(new PlayerUpdateCommand(), {
          client,
          x: message.x,
          y: message.y,
          anim: message.anim,
        })
      }
    )

    this.onMessage(Message.UPDATE_PLAYER_NAME, (client, message: { name: string }) => {
      this.dispatcher.dispatch(new PlayerUpdateNameCommand(), {
        client,
        name: message.name,
      })
    })

    this.onMessage(Message.UPDATE_PLAYER_AREA, (client, message: { areaId: string }) => {
      this.dispatcher.dispatch(new PlayerUpdateAreaCommand(), {
        client,
        areaId: message.areaId,
      })
    })

    this.onMessage(Message.READY_TO_CONNECT, (client) => {
      const player = this.state.players.get(client.sessionId)
      if (player) player.readyToConnect = true
    })

    this.onMessage(Message.ADD_CHAT_MESSAGE, (client, message: { content: string }) => {
      this.dispatcher.dispatch(new ChatMessageUpdateCommand(), {
        client,
        content: message.content,
      })

      this.broadcast(
        Message.ADD_CHAT_MESSAGE,
        { clientId: client.sessionId, content: message.content },
        { except: client }
      )
    })

    this.onMessage(
      Message.ADD_NOTICE_POST,
      (client, message: { content: string; boardId?: string }) => {
        const content = sanitizeNoticeContent(message?.content ?? '')
        if (!content) return
        const boardId =
          typeof message?.boardId === 'string' && message.boardId.trim()
            ? message.boardId.trim().slice(0, 64)
            : 'campus-notice'
        this.dispatcher.dispatch(new NoticePostUpdateCommand(), { client, content, boardId })
      }
    )
  }

  onJoin(client: Client, options: any) {
    this.state.players.set(client.sessionId, new Player())
    client.send(Message.SEND_ROOM_DATA, {
      id: this.roomId,
      name: this.name,
      description: this.description,
    })
  }

  onLeave(client: Client, consented: boolean) {
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId)
    }
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...')
    this.dispatcher.stop()
  }
}
