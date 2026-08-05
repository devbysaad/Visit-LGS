import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { ICampusState } from '../../../types/ICampusState'
import { ChatMessage } from '../schema/CampusState'
import { log } from 'console'

type Payload = {
  client: Client
  content: string
}

export default class ChatMessageUpdateCommand extends Command<ICampusState, Payload> {
  execute(data: Payload) {
    const { client, content } = data
    const player = this.room.state.players.get(client.sessionId)
    const chatMessages = this.room.state.chatMessages

    if (!chatMessages) return

    /**
     * Only allow server to store a maximum of 100 chat messages:
     * remove the first element before pushing a new one when array length is >= 100
     */
    if (chatMessages.length >= 100) chatMessages.shift()

    const newMessage = new ChatMessage()
    newMessage.author = player?.name || 'Unknown'
    console.log('player', player?.name);
    
    newMessage.content = content
    chatMessages.push(newMessage)
  }
}
