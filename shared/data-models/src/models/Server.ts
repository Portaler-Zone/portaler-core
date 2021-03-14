import BaseModel, { DBQuery } from './BaseModel'

interface ServerRoles {
  id: number
  discordRoleId: string
  lastUpdated: string
  isReadOnly: boolean
}

export interface IServerModel {
  id: number
  discordId: string
  discordName: string
  roles: ServerRoles[]
  subdomain?: string | null
  createdOn: Date
  isPublic: boolean
  discordUrl?: string | null
}

export default class ServerModel extends BaseModel {
  constructor(dbQuery: DBQuery) {
    super(dbQuery)
  }

  create = async (discordId: string, discordName: string): Promise<number> => {
    const dbResServer = await this.query(
      `
      INSERT INTO servers(discord_id, discord_name)
      VALUES ($1, $2) RETURNING id;
    `,
      [discordId, discordName]
    )

    return dbResServer.rows[0].id
  }

  createRole = async (
    serverId: number,
    roleId: string,
    readOnly: boolean = false
  ): Promise<number> => {
    const dbResRole = await this.query(
      `INSERT INTO server_roles(server_id, discord_role_id, is_read_only) VALUES($1, $2, $3) RETURNING id`,
      [serverId, roleId, readOnly]
    )

    return dbResRole.rows[0].id
  }

  getServerConfig = async (subdomain: string): Promise<boolean> => {
    const dbRes = await this.query(
      `SELECT is_public FROM servers WHERE subdomain = $1`,
      [subdomain]
    )

    return dbRes.rowCount > 0 ? dbRes.rows[0].is_public : false
  }

  getServer = async (id: number | string): Promise<IServerModel | null> => {
    try {
      const queryString = `
      SELECT
        s.id AS id,
        s.discord_id AS discord_id,
        s.discord_name AS discord_name,
        s.subdomain AS subdomain,
        s.created_on AS created_on,
        s.is_public AS is_public,
        s.discord_url AS discord_url,
        sr.id AS role_id,
        sr.discord_role_id AS discord_role_id,
        sr.last_updated AS role_last_updated,
        sr.is_read_only AS role_readonly
      FROM servers AS s
      LEFT JOIN server_roles AS sr ON sr.server_id = s.id
      WHERE ${typeof id === 'number' ? 's.id' : 's.discord_id'} = $1
    `

      const dbResServer = await this.query(queryString, [id])

      if (dbResServer.rowCount === 0) {
        throw new Error('NoServerFound')
      }

      const fRow = dbResServer.rows[0]

      const server: IServerModel = {
        id: fRow.id,
        discordId: fRow.discord_id,
        discordName: fRow.discord_name,
        subdomain: fRow.subdomain,
        createdOn: fRow.created_on,
        isPublic: fRow.is_public,
        discordUrl: fRow.discord_url,
        roles: dbResServer.rows.map((r) => ({
          id: r.role_id,
          discordRoleId: r.discord_role_id,
          lastUpdated: r.role_last_updated,
          isReadOnly: r.role_readonly,
        })),
      }

      return server
    } catch (err) {
      return null
    }
  }

  getServerIdBySubdomain = async (
    subDomain: string
  ): Promise<number | null> => {
    const dbResServer = await this.query(
      `SELECT id FROM servers WHERE subdomain = $1`,
      [subDomain.toLowerCase()]
    )

    if (dbResServer.rowCount === 0) {
      return null
    }

    return dbResServer.rows[0].id
  }
}
