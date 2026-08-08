import { Schema, ArraySchema, MapSchema, type } from '@colyseus/schema'
import { IPlayer, ICampusState, IChatMessage, INoticePost } from '../../../types/ICampusState'

export class Player extends Schema implements IPlayer {
  @type('string') name = ''
  @type('number') x = 705
  @type('number') y = 500
  @type('string') anim = 'adam_idle_down'
  @type('boolean') readyToConnect = false
  @type('string') areaId = 'outdoor'
  @type('boolean') riding = false
}

export class ChatMessage extends Schema implements IChatMessage {
  @type('string') author = ''
  @type('number') createdAt = new Date().getTime()
  @type('string') content = ''
}

export class NoticePost extends Schema implements INoticePost {
  @type('string') id = ''
  @type('string') author = ''
  @type('number') createdAt = new Date().getTime()
  @type('string') content = ''
  @type('string') boardId = 'campus-notice'
}

export class CampusState extends Schema implements ICampusState {
  @type({ map: Player })
  players = new MapSchema<Player>()

  @type([ChatMessage])
  chatMessages = new ArraySchema<ChatMessage>()

  @type([NoticePost])
  noticePosts = new ArraySchema<NoticePost>()
}
