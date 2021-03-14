import { QueryResult } from 'pg'

import { DiscordMe, DiscordMeGuild } from '@portaler/types'

import BaseModel, { DBQuery } from './BaseModel'
import ServerModel, { IServerModel } from './Server'

interface ServerRoleId {
  serverId: string
  roleId: string
  isReadOnly: boolean
}

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
}

export interface IUserModel {
  id: number
  discordId: string
  discordName: string
  serverAccess?: ServerRoleId[]
  discordRefresh?: string | null
  createdOn: Date
  isBanned: boolean
}

export enum UserAction {
  add = 'add',
  update = 'update',
  delete = 'delete',
  login = 'login',
}

export default class UserModel extends BaseModel {
  constructor(dbQuery: DBQuery) {
    super(dbQuery)
  }

  createUser = async (
    member: DiscordUser,
    serverId: number,
    roles: number[]
  ) => {
    try {
      const user = await this.getUserByDiscord(member.id)

      let userId = user ? user.id : null

      if (!userId) {
        const dbResUser = await this.query(
          `
          INSERT INTO users(discord_id, discord_name, discord_discriminator)
          VALUES ($1, $2, $3) RETURNING id;
          `,
          [member.id, member.username, member.discriminator]
        )

        userId = dbResUser.rows[0].id
      }

      if (userId === null) {
        throw new Error('NoUserFound')
      }

      const adds = []

      adds.push(
        this.query(
          `INSERT INTO user_servers(user_id, server_id) VALUES($1, $2)`,
          [userId, serverId]
        )
      )

      roles.forEach((r) => {
        adds.push(
          this.query(
            `INSERT INTO user_roles(user_id, role_id) VALUES($1, $2)`,
            [userId!, r]
          )
        )
      })

      return await Promise.all(adds)
    } catch (err) {
      throw err
    }
  }

  createLogin = async (
    userInfo: DiscordMe,
    servers: DiscordMeGuild[],
    refreshToken: string
  ): Promise<number> => {
    if (!userInfo.username) {
      throw new Error('NoUsername')
    }

    if (!userInfo.discriminator) {
      throw Error('NoUserDiscriminator')
    }

    if (!refreshToken) {
      throw Error('NoRefreshToken')
    }

    try {
      const serverModel = new ServerModel(this.query)

      const serverResponse: (IServerModel | null)[] = await Promise.all(
        servers.map(async (s) => await serverModel.getServer(s.id))
      )

      const existingServers: IServerModel[] = serverResponse.filter(
        Boolean
      ) as IServerModel[]

      if (existingServers.length === 0) {
        throw Error('NoServersFoundForUser')
      }

      const userExists = await this.getUserByDiscord(userInfo.id)

      let userId = userExists ? userExists.id : null

      if (!userId) {
        const dbResUser = await this.query(
          `
          INSERT INTO users(discord_id, discord_name, discord_discriminator, discord_refresh)
          VALUES ($1, $2, $3, $4) RETURNING id;
          `,
          [userInfo.id, userInfo.username, userInfo.discriminator, refreshToken]
        )

        userId = dbResUser.rows[0].id
      } else {
        await this.query(
          `UPDATE users SET discord_refresh = $1 WHERE id = $2`,
          [refreshToken, userId]
        )
      }

      if (userId === null || !userId) {
        throw new Error('UserNotFoundOrCreated')
      }

      await Promise.all(
        existingServers.map((s) => {
          if (
            userExists?.serverAccess?.find((ue) => ue.serverId === s.discordId)
          ) {
            return this.query(
              `INSERT INTO user_servers(user_id, server_id) VALUES($1, $2)`,
              [userId!, s.id]
            )
          }

          return Promise.resolve(null)
        })
      )

      return userId
    } catch (err) {
      throw err
    }
  }

  addRoles = async (
    userId: number,
    roleIds: number[],
    serverId: number
  ): Promise<boolean> => {
    const dbUserServerRes = await this.query(
      `SELECT * FROM user_servers WHERE user_id = $1 AND server_id = $2`,
      [userId, serverId]
    )

    if (dbUserServerRes.rowCount === 0) {
      await this.query(
        `INSERT INTO user_servers(user_id, server_id) VALUES($1, $2)`,
        [userId, serverId]
      )
    }

    const adds = roleIds.map((r) =>
      this.query(`INSERT INTO user_roles(user_id, role_id) VALUES($1, $2)`, [
        userId,
        r,
      ])
    )

    await Promise.all(adds)

    return true
  }

  getUserByDiscord = async (userId: string): Promise<IUserModel | null> => {
    try {
      const dbResUser = await this.query(
        `SELECT * FROM users WHERE discord_id = $1`,
        [userId]
      )

      if (dbResUser.rowCount === 0) {
        return null
      }

      const fRow = dbResUser.rows[0]

      const user: IUserModel = {
        id: fRow.id,
        discordId: fRow.discord_id,
        discordName: `${fRow.discord_name}#${fRow.discriminator}`,
        discordRefresh: fRow.refresh,
        createdOn: fRow.created_on,
        isBanned: fRow.is_banned,
      }

      return user
    } catch (err) {
      return null
    }
  }

  getFullUser = async (
    userId: number | string,
    serverId: number
  ): Promise<IUserModel | null> => {
    try {
      const dbResUser = await this.query(
        `
      SELECT u.id AS id,
        u.discord_id AS discord_id,
        u.discord_name AS discord_name,
        u.discord_discriminator AS discriminator,
        u.discord_refresh AS refresh,
        u.is_banned as is_banned,
        u.created_on AS created_on,
        sr.server_id AS server_id,
        sr.discord_role_id AS role_id,
        sr.is_read_only AS is_read_only
      FROM users AS u
      JOIN user_servers AS us ON us.user_id = u.id
      LEFT JOIN user_roles AS ur ON ur.user_id = u.id
      LEFT JOIN server_roles AS sr ON sr.server_id = us.server_id AND ur.role_id = sr.id
      WHERE ${
        typeof userId === 'string' ? 'u.discord_id' : 'u.id'
      } = $1 AND us.server_id = $2
    `,
        [userId, serverId]
      )

      if (dbResUser.rowCount === 0) {
        return null
      }

      const fRow = dbResUser.rows[0]

      const user: IUserModel = {
        id: fRow.id,
        discordId: fRow.discord_id,
        discordName: `${fRow.discord_name}#${fRow.discriminator}`,
        discordRefresh: fRow.refresh,
        createdOn: fRow.created_on,
        serverAccess: dbResUser.rows.map((r) => ({
          serverId: r.server_id,
          roleId: r.role_id,
          isReadOnly: r.is_read_only,
        })),
        isBanned: fRow.is_banned,
      }

      return user
    } catch (err) {
      return null
    }
  }

  logUserAction = (
    userId: number,
    serverId: number,
    action: UserAction,
    details: string
  ): Promise<QueryResult> =>
    this.query(
      `
      INSERT INTO user_logs (user_id, server_id, user_action, details)
      VALUES ($1, $2, $3, $4);
    `,
      [userId, serverId, action, details]
    )

  removeUserRoles = (
    userId: number,
    roleIds: number[]
  ): Promise<QueryResult<any>[]> =>
    Promise.all(
      roleIds.map((r) =>
        this.query(
          `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`,
          [userId, r]
        )
      )
    )

  removeUserServer = (userId: number, serverId: number): Promise<QueryResult> =>
    this.query(
      `DELETE FROM user_servers WHERE user_id = $1 AND server_id = $2`,
      [userId, serverId]
    )
}
