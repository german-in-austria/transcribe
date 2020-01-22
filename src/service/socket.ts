
import socketIo from 'socket.io-client'
import { ClientMessage, Message } from '../lib/dioe-real-time-server/src/service/messages.d'
let socket: SocketIOClient.Socket|null = null

export function connectToSocket(url: string) {
  if (socket !== null) {
    socket.disconnect()
  }
  socket = socketIo(
    url,
    { path: '/updates' }
  )
}

export function sendMessage(m: ClientMessage) {
  if (socket !== null) {
    socket.send(m)
  }
}

export function onMessage(cb: (m: Message) => void) {
  if (socket !== null) {
    socket.on('message', (sm: Message) => {
      cb(sm)
    })
  }
}
