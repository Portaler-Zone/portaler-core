import logger from '../../utils/logger'
import { Client } from 'discord.js'
import config from '../../utils/config'

const client = new Client()

client.login(config.discord.bot)

client.on('ready', () => {
  logger.info('Discord Bot Started')
})

export const rolePayload = {
  name: config.discord.role,
  permissions: 0,
  color: '#aa00ff',
  hoist: false,
  mentionableRole: false,
}

export const readOnlyPayload = {
  ...rolePayload,
  name: `${rolePayload.name}-readonly`,
  color: '#fdd835',
}

export default client
