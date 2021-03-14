import { db, redis } from '../../utils/db'
import logger from '../../utils/logger'
import { ServerBody } from './'

const delServer = async (body: ServerBody) => {
  const dbRes = await db.dbQuery(
    'DELETE FROM servers WHERE discord_id = $1 RETURNING id',
    [body.id]
  )

  const serverId = dbRes.rows[0].id

  const dbUserIds = await db.dbQuery(
    'DELETE FROM user_servers WHERE server_id = $1 RETURNING user_id',
    [serverId]
  )

  const dbRolesRes = await db.dbQuery(
    'DELETE FROM server_roles WHERE server_id = $1 RETURNING id',
    [serverId]
  )

  const userRolesDel = dbRolesRes.rows.map((r) =>
    db.dbQuery('DELETE FROM user_roles WHERE role_id = $1', [r.id])
  )

  await redis.delServer(
    serverId,
    dbUserIds.rows.map((u) => u.user_id)
  )

  await Promise.all(userRolesDel)

  logger.info('ServerDeleted', {
    server: body.name,
    userCount: dbUserIds.rowCount,
    users: dbUserIds.rows.map((u) => u.user_id),
  })
}

export default delServer
