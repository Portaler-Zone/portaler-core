import { Client, Guild, GuildMember, PartialGuildMember } from 'discord.js'
import fetch, { Headers } from 'node-fetch'

import { DiscordUser } from '@portaler/data-models'

import config from './config'
import logger from './logger'

const headers = new Headers()

export interface MemberBody {
  user: DiscordUser
  serverId: string
  roles: string[]
}

headers.set('Authorization', `Bearer ${config.portaler.key}`)
headers.set('User-Agent', 'discord-bot')
headers.set('Referrer', 'discord-bot')
headers.set('Content-Type', 'application/json')

const initEvents = (client: Client) => {
  // bot joins a server
  client.on('guildCreate', async (server: Guild) => {
    try {
      const res = await fetch(`${config.portaler.api}/server`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: server.id, name: server.name }),
      })

      if (!res.ok) {
        throw new Error(`status: ${res.status}`)
      }
    } catch (err) {
      logger.error('Error setting up server', {
        name: server.name,
        id: server.id,
        error: {
          error: JSON.stringify(err),
          trace: err.stack,
        },
      })
    }
  })

  // bot is kicked from server
  client.on('guildDelete', async (server: Guild) => {
    try {
      const res = await fetch(`${config.portaler.api}/server`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ id: server.id, name: server.name }),
      })

      if (!res.ok) {
        throw new Error(`status: ${res.status}`)
      }
    } catch (err) {
      logger.error('Error setting up server', {
        name: server.name,
        id: server.id,
        error: {
          error: JSON.stringify(err),
          trace: err.stack,
        },
      })
    }
  })

  // when members get updated
  client.on('guildMemberUpdate', async (_, member: GuildMember) => {
    const roles = (await member.fetch()).roles.cache.values()

    const user: MemberBody = {
      user: {
        id: member.id,
        username: member.user.username,
        discriminator: member.user.discriminator,
      },
      serverId: member.guild.id,
      roles: Array.from(roles).map((r) => r.id),
    }

    try {
      const res = await fetch(`${config.portaler.api}/user`, {
        method: 'POST',
        headers,
        body: JSON.stringify(user),
      })

      if (!res.ok) {
        throw new Error(`status: ${res.status}`)
      }
    } catch (err) {
      logger.error('Error updating user', {
        name: `${member.user?.username}#${member.user?.discriminator}`,
        server: member.guild.name,
        error: {
          error: JSON.stringify(err),
          trace: err.stack,
        },
      })
    }
  })

  // when a member leaves a server
  client.on(
    'guildMemberRemove',
    async (member: GuildMember | PartialGuildMember) => {
      try {
        const _member = await member.fetch(true)

        const user: MemberBody = {
          user: {
            id: member.id,
            username: _member.user.username,
            discriminator: _member.user.discriminator,
          },
          serverId: member.guild.id,
          roles: member.roles.cache.map((r) => r.id),
        }

        const res = await fetch(`${config.portaler.api}/user`, {
          method: 'DELETE',
          headers,
          body: JSON.stringify(user),
        })

        if (!res.ok) {
          throw new Error(`status: ${res.status}`)
        }
      } catch (err) {
        logger.error('Error removing user from server', {
          name: `${member.user?.username}#${member.user?.discriminator}`,
          server: member.guild.name,
          error: {
            error: JSON.stringify(err),
            trace: err.stack,
          },
        })
      }
    }
  )
}

export default initEvents
