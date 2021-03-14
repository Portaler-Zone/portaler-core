import btoa from 'btoa'
import { Router } from 'express'
import { v4 as uuid } from 'uuid'

import { UserAction } from '@portaler/data-models/out/models/User'

import config from '../utils/config'
import { db, redis } from '../utils/db'
import fetchToken from '../utils/discord/fetchToken'
import fetchUser from '../utils/discord/fetchUser'
import fetchUserGuilds from '../utils/discord/fetchUserGuilds'
import logger from '../utils/logger'

const isProd = process.env.NODE_ENV === 'production'

const router = Router()

router.get('/login', (_, res) => {
  res.redirect(config.discord.authUrl)
})

// should come from auth.portaler
router.get('/callback', async (req, res) => {
  try {
    if (!req.query.code) {
      throw new Error('NoCodeProvided')
    }

    if (!req.cookies.subdomain && isProd) {
      throw new Error('NoRedirect')
    }

    const subdomain = isProd ? req.cookies.subdomain : process.env.HOST

    const protocol = req.secure ? 'https://' : 'http://'
    const code = req.query.code as string

    const discordJson = await fetchToken(code)
    const token = discordJson.access_token

    const [me, server] = await Promise.all([
      fetchUser(token),
      fetchUserGuilds(token),
    ])

    const userId = await db.User.createLogin(
      me,
      server,
      discordJson.refresh_token
    )

    const serverId = await db.Server.getServerIdBySubdomain(
      isProd ? subdomain : 'localhost'
    )

    if (!serverId) {
      throw new Error('NoSubdomainServerFound')
    }

    const user = await db.User.getFullUser(userId, serverId)

    const redirectUrl = isProd
      ? `${protocol}${subdomain}.${config.localUrl}`
      : `${protocol}${process.env.HOST}:${process.env.FRONTEND_PORT}`

    if (!user || !user.serverAccess || user.serverAccess.length <= 0) {
      return res.status(401).redirect(`${redirectUrl}/?token=invalid`)
    }

    const uid: string = uuid()

    const ourToken = btoa(uid.replace(/-/gi, '')).replace(/=/gi, '')

    const canWrite = user.serverAccess.some((r) => !r.isReadOnly) || false

    await redis.setUser(ourToken, user.id, serverId, canWrite)

    await db.User.logUserAction(
      user.id,
      serverId,
      UserAction.login,
      JSON.stringify({ user })
    )

    res.redirect(`${redirectUrl}/?token=${ourToken}&canWrite=${canWrite}`)
  } catch (err) {
    logger.error('Error logging in User', {
      error: {
        error: JSON.stringify(err),
        trace: err.stack,
      },
    })
    res.sendStatus(500)
  }
})

export default router
