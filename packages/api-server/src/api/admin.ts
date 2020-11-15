import { DatabaseConnector } from '@portaler/data-models'
import { Request, Response, Router } from 'express'
import config from '../config'
import wrapAsync from '../middleware/wrapAsync'

const db = new DatabaseConnector(config.db)
const router = Router()

router.get(
  '/listServers',
  wrapAsync(async (req: Request, res: Response) => {
    try {
      const dbServerRes = await db.dbQuery(
        `SELECT * FROM servers ORDER BY id`,
        []
      )

      const servers = dbServerRes.rows.map((s) => ({
        id: s.id,
        discordId: s.discord_id,
        discordName: s.discord_name,
        subdomain: s.subdomain,
        createdOn: s.created_on,
      }))

      return res.status(200).json(servers)
    } catch (err) {
      return res.status(500).write(err)
    }
  })
)

router.post(
  '/addServer',
  wrapAsync(async (req: Request, res: Response) => {
    try {
      const body = req.body

      if (typeof body.id !== 'number' || typeof body.subdomain !== 'string') {
        throw new Error('BadPayload')
      }

      await db.dbQuery(`UPDATE servers SET subdomain = $1 WHERE id = $2`, [
        body.subdomain,
        body.id,
      ])

      const server = await db.Server.getServer(body.id)

      return res.status(200).json(server)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  })
)

export default router
