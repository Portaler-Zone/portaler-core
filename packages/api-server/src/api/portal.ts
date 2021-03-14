import { Router } from 'express'
import { DateTime, ISOTimeOptions } from 'luxon'

import { UserAction } from '@portaler/data-models/out/models/User'
import { Portal, PortalPayload } from '@portaler/types'

import {
  deleteServerPortal,
  getServerPortals,
  IPortalModel,
} from '../database/portals'
import { db } from '../utils/db'
import logger from '../utils/logger'

const router = Router()

const ISO_OPTS: ISOTimeOptions = {
  suppressMilliseconds: true,
  includeOffset: false,
}

const getExpireTime = (size: number, hours: number, minutes: number) => {
  const _hours = size === 0 ? 999 : Number(hours)
  const _minutes = size === 0 ? 999 : Number(minutes)

  return DateTime.utc()
    .plus({
      hours: _hours,
      minutes: _minutes,
    })
    .toJSDate()
}

/**
 * GET /api/portal/
 */
router.get('/', async (req, res) => {
  try {
    const dbPortals: IPortalModel[] = await getServerPortals(req.serverId)
    const now = DateTime.utc()

    const portals: Portal[] = dbPortals.map((p) => {
      const expires = DateTime.fromJSDate(p.expires).toUTC()

      const connection: [string, string] = [p.conn1, p.conn2].sort() as [
        string,
        string
      ]

      return {
        id: p.id,
        connection,
        size: p.size,
        expiresUtc: expires.toISO(ISO_OPTS),
        timeLeft: expires.diff(now).as('seconds'),
      }
    })

    res.status(200).send(portals)
  } catch (err) {
    logger.error('Error fetching portals', {
      user: req.userId,
      server: req.serverId,
      error: err,
    })

    res.sendStatus(500)
  }
})

/**
 * POST /api/portal/
 */
router.post('/', async (req, res) => {
  try {
    if (req.userId === 0) {
      return res.sendStatus(401)
    } else if (!req.canWrite) {
      return res.sendStatus(403)
    }

    const body: PortalPayload = req.body

    const expires = getExpireTime(body.size, body.hours, body.minutes)

    const conns = body.connection.sort()

    // TODO move the queries in this function to the new package
    // retain backwards compatibility until we can edit connections
    const dbRes = await db.dbQuery(
      `
      SELECT id
      FROM (SELECT * FROM portals WHERE server_id = $1 AND conn1 = $2 AND conn2 = $3) portal;
    `,
      [req.serverId, conns[0], conns[1]]
    )

    if (dbRes.rowCount === 0) {
      await db.dbQuery(
        `
      INSERT INTO portals (server_id, conn1, conn2, size, expires, created_by)
      VALUES ($1, $2, $3, $4, $5, $6);
    `,
        [req.serverId, conns[0], conns[1], body.size, expires, req.userId]
      )

      await db.User.logUserAction(
        req.userId,
        req.serverId,
        UserAction.add,
        JSON.stringify({
          conns,
          expires,
        })
      )
    } else {
      await db.dbQuery(
        `
        UPDATE portals
        SET size = $1, expires = $2
        WHERE id = $3;
      `,
        [body.size, expires, dbRes.rows[0].id]
      )

      const portalUpdateDb = await db.dbQuery(
        `
        SELECT ROW_TO_JSON(portal) as json_field
        FROM (SELECT * FROM portals WHERE id = $1) portal
        `,
        [dbRes.rows[0].id]
      )

      await db.User.logUserAction(
        req.userId,
        req.serverId,
        UserAction.update,
        JSON.stringify({
          from: dbRes.rows[0].json_field,
          to: portalUpdateDb.rows[0].json_field,
        })
      )
    }

    res.sendStatus(204)
  } catch (err) {
    logger.error('Error setting portals', {
      user: req.userId,
      server: req.serverId,
      error: {
        error: JSON.stringify(err),
        trace: err.stack,
      },
    })

    res.sendStatus(500)
  }
})

/**
 * DELETE /api/portal/
 */
router.delete('/', async (req, res) => {
  try {
    if (req.userId === 0) {
      return res.sendStatus(401)
    } else if (!req.canWrite) {
      return res.sendStatus(403)
    }

    const portalIds = req.body.portals
      .map((p: number) => {
        const id = Number(p)

        if (isNaN(id)) {
          return null
        }

        return id
      })
      .filter(Boolean)

    await deleteServerPortal(portalIds, req.userId, req.serverId)
    res.sendStatus(204)
  } catch (err) {
    logger.error('Unable to delete', {
      user: req.userId,
      server: req.serverId,
      error: {
        error: JSON.stringify(err),
        trace: err.stack,
      },
    })
    res.sendStatus(500)
  }
})

export default router
