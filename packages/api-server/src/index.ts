import 'dotenv/config'

import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'

import Auth from './api/auth'
import Health from './api/health'
import config from './config'
import { migrations } from './db/migrations'
import { client as botClient } from './bot'

// Run DB Migrations
migrations()

// Init bot
botClient.login(config.discord.bot)

const app = express()

app.use(cors(config.cors))
// app.options('cors stuff here', cors(config.cors))

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use('/api/health', Health)
app.use('/api/auth', Auth)

app.listen(config.port, () =>
  console.log(`App started on port ${config.host}:${config.port}`)
)
