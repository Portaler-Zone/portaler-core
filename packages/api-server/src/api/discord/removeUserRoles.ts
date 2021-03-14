import { db, redis } from '../../utils/db'
import { MemberBody } from './'

const removeUserRoles = async (body: MemberBody) =>
  new Promise<void>(async (res, rej) => {
    try {
      const [server, user] = await Promise.all([
        db.Server.getServer(body.serverId),
        db.User.getUserByDiscord(body.user.id),
      ])

      if (user && server) {
        const removeRoles = server.roles.filter(
          (r) => !body.roles.includes(r.discordRoleId)
        )

        await db.User.removeUserRoles(
          user.id,
          removeRoles.map((r) => r.id)
        )

        if (body.roles.length === 0) {
          await db.User.removeUserServer(user.id, server.id)
        }

        const token = await redis.getToken(user.id, server.id)

        if (token) {
          await redis.delUser(token, user.id, server.id)
        }
      }

      res()
    } catch (err) {
      rej(err)
    }
  })

export default removeUserRoles
