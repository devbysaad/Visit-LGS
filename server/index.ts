import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '.env') })
dotenv.config({ path: path.join(__dirname, '.env') })

import http from 'http'
import express from 'express'
import cors from 'cors'
import { Server } from 'colyseus'
import { monitor } from '@colyseus/monitor'
import { RoomType } from '../types/Rooms'

import { CampusRoom } from './rooms/CampusRoom'
import { createClerkAuthRouter } from './clerkAuth'

const port = Number(process.env.PORT || 2567)
const app = express()

const corsOrigin = process.env.CORS_ORIGIN || true
app.use(cors({ origin: corsOrigin }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    clerk: Boolean(process.env.CLERK_SECRET_KEY),
    database: Boolean(process.env.DATABASE_URL),
  })
})

app.use('/auth', createClerkAuthRouter())

const server = http.createServer(app)
const gameServer = new Server({
  server,
})

gameServer.define(RoomType.CAMPUS, CampusRoom, {
  name: 'CampusQuest',
  description: 'LGS Wah Cantt (Gudwal) campus explorer',
  autoDispose: false,
})

if (process.env.NODE_ENV !== 'production') {
  app.use('/colyseus', monitor())
}

gameServer.listen(port)
console.log(`Listening on ws://localhost:${port}`)
console.log(
  `[env] CLERK_SECRET_KEY=${process.env.CLERK_SECRET_KEY ? 'set' : 'MISSING'} | DATABASE_URL=${
    process.env.DATABASE_URL ? 'set' : 'MISSING'
  } | DIRECT_URL=${process.env.DIRECT_URL ? 'set' : 'MISSING'}`
)
