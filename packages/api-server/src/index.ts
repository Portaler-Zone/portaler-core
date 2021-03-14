import 'dotenv/config'

import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import Api from './api'
import Admin from './api/admin'
import Auth from './api/auth'
import ConfigRouter from './api/config'
import Discord from './api/discord'
import Zone from './api/zone'
import initServer from './initServer'
import checkAdmin from './middleware/checkAdmin'
import syntaxError from './middleware/syntaxError'
import validator from './middleware/validator'
import verifyUser from './middleware/verifyUser'
import config from './utils/config'
import logger from './utils/logger'

const app = express()

// initialize the server
;(async () => {
  await initServer()

  // app.enable('etag')

  app.use(cors(config.cors))

  app.use(express.json())
  app.use(cookieParser())
  app.use(compression())

  app.use(validator)
  app.use(syntaxError)

  // Un-authed routes
  app.use('/api/auth', Auth)
  app.get('/api/health', (_, res) => res.status(200).send({ server: 'ok' }))
  app.get('/api/bot', (_, res) => res.redirect(config.discord.botUrl))
  app.use('/api/config', ConfigRouter)
  app.use('/api/zone', Zone)

  // Authed routes
  app.use('/api/admin', checkAdmin, Admin)
  app.use('/api/discord', checkAdmin, Discord)
  app.use('/api', verifyUser, Api)

  app.listen(config.port, () => logger.info(`Started: ${config.port}`))
})()
