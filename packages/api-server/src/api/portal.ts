import { Router } from 'express'
import { DateTime, ISOTimeOptions } from 'luxon'

import { Portal, PortalPayload } from '@portaler/types'

import {
  deleteServerPortal,
  getServerPortals,
  IPortalModel,
  updateServerPortal,
} from '../database/portals'
import { db } from '../utils/db'
import logger from '../utils/logger'
import { UserAction } from '@portaler/data-models/out/models/User'

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
    logger.log.error(
      'Error fetching portals',
      { user: req.userId, server: req.serverId },
      err
    )
    res.status(500).send({ error: 'Error fetching portals' })
  }
})

router.post('/', async (req, res) => {
  try {
    const body: PortalPayload = req.body

    const expires = getExpireTime(body.size, body.hours, body.minutes)

    const conns = body.connection.sort()

    // TODO move the queries in this function to the new package
    // retain backwards compatibility until we can edit connections
    const dbRes = await db.dbQuery(
      `
      SELECT ROW_TO_JSON(portal) as json_field FROM portals
      WHERE server_id = $1 AND conn1 = $2 AND conn2 = $3;
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
      const updateRes = await db.dbQuery(
        `
        UPDATE portals
        SET size = $1, expires = $2
        WHERE id = $3 RETURNING id;
      `,
        [body.size, expires, dbRes.rows[0].id]
      )

      const portalUpdateDb = await db.dbQuery(
        `
        SELECT ROW_TO_JSON(portal) as json_field
        FROM (SELECT * FROM portals WHERE id = $1) portal
        `,
        [updateRes.rows[0].id]
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
    logger.log.error(
      'Error setting portals',
      { user: req.userId, server: req.serverId },
      err
    )
    res.status(500).send({ error: 'Error setting portals' })
  }
})

router.delete('/', async (req, res) => {
  try {
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
    res.send(204)
  } catch (err) {
    logger.log.error('Unable to delete', err)
    res.status(500).send({ error: 'Error deleting portal' })
  }
})

export default router
