import { CorsOptions } from 'cors'

import { DBConfig, RedisConfig } from '@portaler/types'

interface IConfig {
  cors: CorsOptions
  port: number
  host: string
  localUrl: string
  discord: {
    authUrl: string
    botUrl: string
    redirectUri: string
    apiUrl: string
    public: string
    client: string
    secret: string
    role: string
    bot: string
  }
  db: DBConfig
  redis: RedisConfig
  dns: string | null
}

const port = Number(process.env.PORT || 4242)
const host = process.env.HOST!

const localUrl = `${host}${
  process.env.NODE_ENV !== 'production' ? `:${process.env.FRONTEND_PORT}` : ''
}`

// Build Regex for CORS
const replace = process.env.HOST?.split('.').join('\\.')
const regex = new RegExp(`/${replace}/$`)

const discordApi = 'https://discord.com/api'
const discordAuthUrl = `${discordApi}/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_TOKEN}`
const discordBotPerms = '268435456'

const config: IConfig = {
  cors: {
    origin: regex,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  },
  port,
  host,
  localUrl,
  discord: {
    authUrl: `${discordAuthUrl}&redirect_uri=${encodeURI(
      process.env.DISCORD_REDIRECT_URI!
    )}&response_type=code&scope=identify%20guilds`,
    botUrl: `${discordAuthUrl}&scope=bot&permissions=${discordBotPerms}`,
    redirectUri: process.env.DISCORD_REDIRECT_URI!,
    apiUrl: discordApi,
    public: process.env.DISCORD_PUBLIC_TOKEN!,
    client: process.env.DISCORD_CLIENT_TOKEN!,
    secret: process.env.DISCORD_SECRET_TOKEN!,
    role: process.env.DISCORD_ROLE!,
    bot: process.env.DISCORD_BOT_TOKEN!,
  },
  db: {
    host: process.env.DB_HOST!,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
    port: Number(process.env.DB_PORT || 5432),
  },
  redis: {
    host: process.env.REDIS_HOST!,
    password: process.env.REDIS_PASSWORD!,
    port: Number(process.env.REDIS_PORT || 6379),
  },
  dns: process.env.USE_DNS || null,
}

export default config
