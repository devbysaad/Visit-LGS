import { Client, Room } from 'colyseus.js'
import { ICampusState, IPlayer, INoticePost } from '../../../types/ICampusState'
import { Message } from '../../../types/Messages'
import { RoomType } from '../../../types/Rooms'
import { phaserEvents, Event } from '../events/EventCenter'
import store from '../stores'
import { setSessionId, setPlayerNameMap, removePlayerNameMap } from '../stores/UserStore'
import { setJoinedRoomData, setJoinError, setJoining } from '../stores/RoomStore'
import {
  pushChatMessage,
  pushPlayerJoinedMessage,
  pushPlayerLeftMessage,
} from '../stores/ChatStore'
import { setNoticePosts, pushNoticePost } from '../stores/NoticeBoardStore'
import { connectionLost } from '../stores/ConnectionStore'
import {
  openEggDialog,
  eggResult,
  eggAnnounced,
  syncProgress,
} from '../stores/EggStore'
import { sanitizeName, sanitizeChatMessage, sanitizeNoticePost } from '../utils/moderation'

export default class Network {
  private client: Client
  private room?: Room<ICampusState>
  private joining = false

  mySessionId!: string

  constructor() {
    const protocol = window.location.protocol.replace('http', 'ws')
    const endpoint =
      process.env.NODE_ENV === 'production'
        ? import.meta.env.VITE_SERVER_URL
        : `${protocol}//${window.location.hostname}:2567`
    this.client = new Client(endpoint)

    this.joinCampus()

    phaserEvents.on(Event.MY_PLAYER_NAME_CHANGE, this.updatePlayerName, this)
    phaserEvents.on(Event.MY_PLAYER_TEXTURE_CHANGE, this.updatePlayer, this)
  }

  /** Join (or re-join) the single campus room. Safe to call again after a failure. */
  async joinCampus() {
    if (this.joining || this.room) return
    this.joining = true
    store.dispatch(setJoining(true))
    store.dispatch(setJoinError(null))
    try {
      this.room = await this.client.joinOrCreate(RoomType.CAMPUS)
      this.initialize()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not connect to the campus server. Is it running on port 2567?'
      console.error('[Network] joinCampus failed', error)
      store.dispatch(setJoinError(message))
      phaserEvents.emit(Event.CAMPUS_ROOM_JOIN_FAILED, message)
    } finally {
      this.joining = false
      store.dispatch(setJoining(false))
    }
  }

  /** Clear a failed session and try again (used by ConnectionError UI). */
  async retryJoin() {
    this.room = undefined
    await this.joinCampus()
  }

  initialize() {
    if (!this.room) return

    this.mySessionId = this.room.sessionId
    store.dispatch(setSessionId(this.room.sessionId))
    store.dispatch(setJoinError(null))

    this.room.state.players.onAdd = (player: IPlayer, key: string) => {
      if (key === this.mySessionId) return

      player.onChange = (changes) => {
        changes.forEach((change) => {
          const { field, value } = change
          phaserEvents.emit(Event.PLAYER_UPDATED, field, value, key)

          if (field === 'name' && value !== '') {
            phaserEvents.emit(Event.PLAYER_JOINED, player, key)
            store.dispatch(setPlayerNameMap({ id: key, name: value }))
            store.dispatch(pushPlayerJoinedMessage(value))
          }
        })
      }
    }

    this.room.state.players.onRemove = (player: IPlayer, key: string) => {
      phaserEvents.emit(Event.PLAYER_LEFT, key)
      store.dispatch(pushPlayerLeftMessage(player.name))
      store.dispatch(removePlayerNameMap(key))
    }

    this.room.state.chatMessages.onAdd = (item) => {
      store.dispatch(pushChatMessage(item))
    }

    // Existing + new posts; clear first so a re-join does not keep stale Redux rows.
    store.dispatch(setNoticePosts([]))
    this.room.state.noticePosts.onAdd = (item: INoticePost) => {
      store.dispatch(pushNoticePost(item))
    }

    this.room.onMessage(Message.SEND_ROOM_DATA, (content) => {
      store.dispatch(setJoinedRoomData(content))
    })

    this.room.onMessage(Message.ADD_CHAT_MESSAGE, ({ clientId, content }) => {
      phaserEvents.emit(Event.UPDATE_DIALOG_BUBBLE, clientId, content)
    })

    this.room.onMessage(Message.EGG_APPROACH, (payload) => {
      store.dispatch(
        openEggDialog({
          eggId: payload.egg.id,
          prompt: payload.egg.prompt,
          hint: payload.egg.hint,
          solved: payload.solved,
          solvedBy: payload.solvedBy,
          attemptsLeft: payload.attemptsLeft,
        })
      )
    })

    this.room.onMessage(Message.EGG_RESULT, (payload) => {
      store.dispatch(eggResult(payload))
    })

    this.room.onMessage(Message.EGG_PROGRESS, (payload) => {
      store.dispatch(syncProgress(payload))
    })

    this.room.onMessage(Message.EGG_ANNOUNCE, (payload: { text: string }) => {
      store.dispatch(eggAnnounced(payload.text))
    })

    this.room.onLeave((code) => {
      store.dispatch(connectionLost(`left (${code})`))
    })
    this.room.onError((code, message) => {
      store.dispatch(connectionLost(message || `error ${code}`))
    })

    phaserEvents.emit(Event.CAMPUS_ROOM_JOINED)
  }

  onChatMessageAdded(callback: (playerId: string, content: string) => void, context?: any) {
    phaserEvents.on(Event.UPDATE_DIALOG_BUBBLE, callback, context)
  }

  onPlayerJoined(callback: (Player: IPlayer, key: string) => void, context?: any) {
    phaserEvents.on(Event.PLAYER_JOINED, callback, context)
  }

  onPlayerLeft(callback: (key: string) => void, context?: any) {
    phaserEvents.on(Event.PLAYER_LEFT, callback, context)
  }

  onMyPlayerReady(callback: (key: string) => void, context?: any) {
    phaserEvents.on(Event.MY_PLAYER_READY, callback, context)
  }

  onPlayerUpdated(
    callback: (field: string, value: number | string, key: string) => void,
    context?: any
  ) {
    phaserEvents.on(Event.PLAYER_UPDATED, callback, context)
  }

  updatePlayer(currentX: number, currentY: number, currentAnim: string) {
    this.room?.send(Message.UPDATE_PLAYER, { x: currentX, y: currentY, anim: currentAnim })
  }

  updatePlayerName(currentName: string) {
    this.room?.send(Message.UPDATE_PLAYER_NAME, { name: sanitizeName(currentName) })
  }

  updatePlayerArea(areaId: string) {
    this.room?.send(Message.UPDATE_PLAYER_AREA, { areaId })
  }

  updatePlayerRiding(riding: boolean) {
    this.room?.send(Message.UPDATE_PLAYER_RIDING, { riding })
  }

  readyToConnect() {
    this.room?.send(Message.READY_TO_CONNECT)
    phaserEvents.emit(Event.MY_PLAYER_READY)
  }

  addChatMessage(content: string) {
    this.room?.send(Message.ADD_CHAT_MESSAGE, { content: sanitizeChatMessage(content) })
  }

  addNoticePost(content: string, boardId: string = 'campus-notice') {
    const cleaned = sanitizeNoticePost(content)
    if (!cleaned) {
      console.warn('[Network] addNoticePost ignored empty content')
      return
    }
    if (!this.room) {
      console.warn('[Network] addNoticePost failed — not in campus room yet')
      return
    }
    this.room.send(Message.ADD_NOTICE_POST, {
      content: cleaned,
      boardId: boardId || 'campus-notice',
    })
  }

  approachEgg(eggId: string) {
    this.room?.send(Message.EGG_APPROACH, { eggId })
  }

  answerEgg(eggId: string, guess: string) {
    this.room?.send(Message.EGG_ANSWER, { eggId, guess })
  }
}
