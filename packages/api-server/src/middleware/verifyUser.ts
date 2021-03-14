import { NextFunction, Request, Response } from 'express'

import { redis } from '../utils/db'
import logger from '../utils/logger'

const isProd = process.env.NODE_ENV === 'production'

const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (process.env.DISABLE_AUTH === 'true') {
      req.userId = 1
      req.serverId = 1
      return next()
    }

    const configSubdomain = isProd ? req.subdomains[0] : process.env.HOST

    const serverConfigRes = await redis.getAsync(`server:${configSubdomain}`)
    const serverConfig = serverConfigRes ? JSON.parse(serverConfigRes) : false

    if (serverConfig && serverConfig.isPublic) {
      req.isPublic = true
      req.serverId = serverConfig.serverId
    }

    if (!req.headers.authorization) {
      if (serverConfig.isPublic) {
        req.userId = 0
        return next()
      }

      return res.sendStatus(401)
    }

    const authHeaders = req.headers.authorization.split(' ')

    if (authHeaders[0] !== 'Bearer') {
      if (serverConfig.isPublic) {
        req.userId = 0
        return next()
      }

      return res.sendStatus(401)
    }

    const token = authHeaders[1]

    const userServer = await redis.getUser(token)

    if (!userServer) {
      if (serverConfig.isPublic) {
        req.userId = 0
        return next()
      }

      return res.sendStatus(403)
    }

    const [userId, serverId, canWrite] = userServer.split(':')

    const subdomain = await redis.getAsync(`server:${serverId}`)

    if (isProd && subdomain !== req.subdomains[0]) {
      if (serverConfig.isPublic) {
        req.userId = 0
        return next()
      }

      return res.sendStatus(403)
    }

    req.userId = Number(userId)
    req.serverId = Number(serverId)
    req.canWrite = canWrite.toLowerCase() === 'true'

    next()
  } catch (err) {
    logger.warn('Error verifying user', {
      error: {
        error: JSON.stringify(err),
        trace: err.stack,
      },
    })
    return res.status(500).send({ error: 'Error Verifying User' })
  }
}

export default verifyUser
