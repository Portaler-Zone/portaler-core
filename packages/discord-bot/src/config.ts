import { DBConfig } from '@portaler/types'

interface BotConfig {
  db: DBConfig
  portaler: {
    api: string
    key: string
  }
  token: string
  roleName: string
  api: string
}

const config: BotConfig = {
  db: {
    host: process.env.DB_HOST!,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
    port: Number(process.env.DB_PORT || 5432),
  },
  portaler: {
    api: process.env.PORTALER_API_URL!,
    key: process.env.ADMIN_KEY!,
  },
  token: process.env.DISCORD_BOT_TOKEN!,
  roleName: process.env.DISCORD_ROLE!,
  api: 'https://discord.com/api',
}

export default config
