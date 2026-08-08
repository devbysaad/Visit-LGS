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
import { eggById, matches, publicView } from '../eggs/content'
import { claim, hasSolved, solvedBy, solveCounts } from '../eggs/claims'

/** Mirror client moderation — keep posts short for a school board. */
const MAX_NOTICE_LENGTH = 280
const MAX_EGG_ATTEMPTS = 6
const EGG_ANSWER_COOLDOWN_MS = 700

function sanitizeNoticeContent(raw: string): string {
  return raw.trim().slice(0, MAX_NOTICE_LENGTH)
}

export class CampusRoom extends Room<CampusState> {
  private dispatcher = new Dispatcher(this)
  private name: string
  private description: string
  private eggAttempts = new Map<string, number>()
  private eggLastAnswer = new Map<string, number>()

  private attemptKey(client: Client, eggId: string) {
    return `${client.sessionId}:${eggId}`
  }

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

    this.onMessage(Message.UPDATE_PLAYER_RIDING, (client, message: { riding: boolean }) => {
      const player = this.state.players.get(client.sessionId)
      if (player) player.riding = !!message?.riding
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

    this.onMessage(Message.EGG_APPROACH, (client, message: { eggId: string }) => {
      const egg = eggById(message?.eggId)
      if (!egg) return
      client.send(Message.EGG_APPROACH, {
        egg: publicView(egg),
        solved: hasSolved(egg.id, client.sessionId),
        solvedBy: solveCounts()[egg.id] ?? 0,
        attemptsLeft:
          MAX_EGG_ATTEMPTS - (this.eggAttempts.get(this.attemptKey(client, egg.id)) ?? 0),
      })
    })

    this.onMessage(Message.EGG_ANSWER, (client, message: { eggId: string; guess: string }) => {
      const egg = eggById(message?.eggId)
      if (!egg) return
      const guess = typeof message?.guess === 'string' ? message.guess : ''

      if (hasSolved(egg.id, client.sessionId)) {
        client.send(Message.EGG_RESULT, {
          eggId: egg.id,
          correct: true,
          first: false,
          already: true,
          reveal: egg.reveal,
          source: egg.source,
          kind: egg.kind,
          solvedBy: solveCounts()[egg.id] ?? 0,
        })
        return
      }

      const now = Date.now()
      const last = this.eggLastAnswer.get(client.sessionId) ?? 0
      if (now - last < EGG_ANSWER_COOLDOWN_MS) {
        client.send(Message.EGG_RESULT, { eggId: egg.id, correct: false, throttled: true })
        return
      }
      this.eggLastAnswer.set(client.sessionId, now)

      const key = this.attemptKey(client, egg.id)
      const used = this.eggAttempts.get(key) ?? 0
      if (used >= MAX_EGG_ATTEMPTS) {
        client.send(Message.EGG_RESULT, { eggId: egg.id, correct: false, lockedOut: true })
        return
      }

      if (!matches(egg, guess)) {
        this.eggAttempts.set(key, used + 1)
        client.send(Message.EGG_RESULT, {
          eggId: egg.id,
          correct: false,
          attemptsLeft: MAX_EGG_ATTEMPTS - (used + 1),
        })
        return
      }

      const result = claim(egg.id, client.sessionId)
      client.send(Message.EGG_RESULT, {
        eggId: egg.id,
        correct: true,
        first: result.first,
        already: result.already,
        reveal: egg.reveal,
        source: egg.source,
        kind: egg.kind,
        solvedBy: result.solvedBy,
      })

      const player = this.state.players.get(client.sessionId)
      const who = player?.name || 'A classmate'
      this.broadcast(
        Message.EGG_ANNOUNCE,
        { text: `${who} cracked an orientation clue!` },
        { except: client }
      )
    })
  }

  onJoin(client: Client, options: any) {
    this.state.players.set(client.sessionId, new Player())
    client.send(Message.SEND_ROOM_DATA, {
      id: this.roomId,
      name: this.name,
      description: this.description,
    })
    client.send(Message.EGG_PROGRESS, { solved: solvedBy(client.sessionId) })
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
