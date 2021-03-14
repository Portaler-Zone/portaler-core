import { db, redis } from '../../utils/db'
import { MemberBody } from './'
import removeUserRoles from './removeUserRoles'

const updateUser = async (body: MemberBody) => {
  const server = await db.Server.getServer(body.serverId)

  if (!server) {
    throw new Error(`No server found for user: ${JSON.stringify(body)}`)
  }

  const serverRoleIds = server?.roles.map((r) => r.id)

  const user = await db.User.getFullUser(body.user.id, server.id)
  const bodyRoles = server.roles.filter((r) =>
    body.roles.includes(r.discordRoleId)
  )

  const bodyRoleIds = bodyRoles.map((r) => r.id)

  if (!user) {
    await db.User.createUser(body.user, server.id, bodyRoleIds)
    return
  }

  const removeList = serverRoleIds.filter((br) => !bodyRoleIds.includes(br))

  if (removeList.length === serverRoleIds?.length) {
    removeUserRoles(body)
    return
  } else if (removeList.length > 0) {
    await db.User.removeUserRoles(user.id, removeList)
  }

  const userRoles = user.serverAccess?.map((r) => r.roleId)
  const addList = bodyRoles
    .filter((br) => !userRoles?.includes(br.discordRoleId))
    .map((r) => r.id)

  if (addList.length > 0) {
    await db.User.addRoles(user.id, addList, server.id)
  }

  const token = await redis.getToken(user.id, server.id)

  if (token) {
    await redis.delUser(token, user.id, server.id)
  }
}

export default updateUser
