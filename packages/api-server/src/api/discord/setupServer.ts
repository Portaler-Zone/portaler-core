import { Guild } from 'discord.js'

import { DiscordUser } from '@portaler/data-models/out/models/User'

import { db, redis } from '../../utils/db'
import logger from '../../utils/logger'
import { ServerBody } from './'
import client, { readOnlyPayload, rolePayload } from './client'

interface RoleInfo {
  dbId: number
  discId: string
}

const addRole = async (
  server: Guild,
  serverId: number,
  readOnly: boolean
): Promise<RoleInfo> => {
  const role = await server.roles.create({
    data: readOnly ? readOnlyPayload : rolePayload,
    reason: 'Add authentication for Portaler',
  })

  const roleServerId = await db.Server.createRole(serverId, role.id, readOnly)

  return {
    dbId: roleServerId,
    discId: role.id,
  }
}

const setupServer = (body: ServerBody) =>
  new Promise<void>(async (res, rej) => {
    try {
      const dbServer = await db.Server.getServer(body.id)

      const serverId = dbServer
        ? dbServer.id
        : await db.Server.create(body.id, body.name)

      const discordServer: Guild = await client.guilds.fetch(body.id)

      const discordServerRoles: { id: string; name: string }[] = (
        await discordServer.roles.cache
      )
        .map((r) => ({ id: r.id, name: r.name }))
        .filter(
          (r) => r.name === rolePayload.name || r.name === readOnlyPayload.name
        )

      const roleTuple: [RoleInfo, RoleInfo] = [
        { dbId: 0, discId: '' },
        { dbId: 0, discId: '' },
      ]

      if (discordServerRoles.length === 0) {
        for (let i = 0; i < 2; i++) {
          roleTuple[i] = await addRole(discordServer, serverId, i === 1)
        }
      } else {
        for (const r in discordServerRoles) {
          const pos = discordServerRoles[r].name === rolePayload.name ? 0 : 1

          const roleServerId = await db.Server.createRole(
            serverId,
            discordServerRoles[r].id,
            pos === 1
          )

          roleTuple[pos] = {
            dbId: roleServerId,
            discId: discordServerRoles[r].id,
          }
        }

        if (roleTuple[0].dbId === 0) {
          roleTuple[0] = await addRole(discordServer, serverId, false)
        } else if (roleTuple[1].dbId === 0) {
          roleTuple[1] = await addRole(discordServer, serverId, true)
        }
      }

      const memberCache = await discordServer.members.fetch({ force: true })

      const discordMembers = Array.from(memberCache.values()).filter((m) =>
        m.roles.cache.some(
          (r) => r.id === roleTuple[0].discId || r.id === roleTuple[1].discId
        )
      )

      const discordMemberIds = discordMembers.map((m) => m.id)

      const membersInDb = await Promise.all(
        discordMemberIds.map((dId) => db.User.getUserByDiscord(dId))
      )

      await Promise.all(
        discordMembers.map(async (m) => {
          const user = membersInDb.find((mDb) => mDb?.discordId === m.id)
          const memberRoleIds = m.roles.cache.map((r) => r.id)

          const rolesToAdd = roleTuple
            .filter((rt) => memberRoleIds.includes(rt.discId))
            .map((r) => r.dbId)

          const discordUser: DiscordUser = {
            id: m.id,
            username: m.user.username,
            discriminator: m.user.discriminator,
          }

          if (!user) {
            return db.User.createUser(discordUser, serverId!, rolesToAdd)
          } else {
            return db.User.addRoles(user.id, rolesToAdd, serverId!)
          }
        })
      )

      const subdomain = dbServer?.subdomain ?? null

      if (subdomain) {
        await redis.setAsync(`server:${serverId!}`, subdomain)

        await redis.setAsync(
          `server:${subdomain}`,
          JSON.stringify({
            isPublic: dbServer?.isPublic,
            serverId: dbServer?.id,
            discordUrl: dbServer?.discordUrl,
          })
        )
      }

      logger.info('Added server', {
        id: serverId,
        name: body.name,
        discordId: body.id,
        memberCount: discordMemberIds.length,
      })

      res()
    } catch (err) {
      rej(err)
    }
  })

export default setupServer
