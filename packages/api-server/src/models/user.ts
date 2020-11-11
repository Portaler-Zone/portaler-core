import { QueryResult } from 'pg'

import { UserModel } from '@portaler/types'

import { dbQuery } from '../db'
import { DiscordMe } from '../utils/discord/fetchUser'
import { DiscordMeGuilds } from '../utils/discord/fetchUserGuilds'

export type UserError = 'NoUser' | 'NoServers' | 'NoRoles'

/**
 * Gets a User from the database
 * @param  discordId
 * @returns UserModel
 */
export const getUser = async (
  discordId: string
): Promise<UserModel | UserError> => {
  const {
    rows: userRows,
  } = await dbQuery('SELECT * FROM users WHERE discord_id = $1', [discordId])

  if (userRows.length === 0) {
    return Promise.resolve('NoUser')
  }

  const user: UserModel = {
    id: userRows[0].id,
    discordId: userRows[0].discord_id,
    discordName: userRows[0].discord_name,
    discordRefresh: userRows[0].discord_refresh,
    createdOn: userRows[0].created_on,
  }

  const { rows: userServers } = await dbQuery(
    `
    SELECT us.discord_id AS server, ur.discord_role_id AS role
    FROM user_servers AS us
    JOIN user_roles AS ur ON (us.user = ur.user)
    WHERE us.user = $1
  `,
    [user.id]
  )

  if (userServers.length === 0) {
    return Promise.resolve('NoServers')
  }

  user.serverAccess = userServers.map((s) => ({
    serverId: s.server,
    roleId: s.role,
  }))

  return Promise.resolve(user)
}
/**
 * Adds a user to the database and associates their servers
 * @param  userInfo
 * @param  servers
 * @param  refreshToken
 * @returns QueryResults
 */
export const addUser = async (
  userInfo: DiscordMe,
  servers: DiscordMeGuilds[],
  refreshToken: string
): Promise<QueryResult[]> => {
  const { rows: userRows } = await dbQuery(
    `
    INSERT INTO users(discord_id, discord_name, discord_refresh)
    VALUES ($1, $2, $3) RETURNING id
    `,
    [
      userInfo.id,
      `${userInfo.username}#${userInfo.discriminator}`,
      refreshToken,
    ]
  )

  const userId = userRows[0].id

  const discordServers = servers.map((s) => s.id).join(', ')

  const {
    rows: serverRows,
  } = await dbQuery(`SELECT id FROM servers WHERE server_id IN ($1)`, [
    discordServers,
  ])

  const insertStmt = `INSERT INTO user_servers(user, server_id) VALUES ($1, $2)`

  const insertPromises = serverRows.map(
    async (s) => await dbQuery(insertStmt, [userId, s.id])
  )

  return Promise.all(insertPromises)
}
/**
 * Grant user permissions
 * @param  userId
 * @param  roleId
 */
export const addUserRole = async (userId: number, roleId: number) =>
  await dbQuery(`INSERT INTO user_roles(user, role_id) VALUES ($1, $2)`, [
    userId,
    roleId,
  ])
/**
 * Remove a user from a role
 * @param  userId
 * @param  roleId
 */
export const removeUserRole = async (userId: number, roleId: number) =>
  await dbQuery(`DELETE FROM user_roles WHERE userId = $1 AND role_id = $2`, [
    userId,
    roleId,
  ])
