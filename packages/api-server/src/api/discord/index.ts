import { Router } from 'express'

import { DiscordUser } from '@portaler/data-models/out/models/User'

import logger from '../../utils/logger'
import delServer from './delServer'
import removeUserRoles from './removeUserRoles'
import setupServer from './setupServer'
import updateUser from './updateUser'

const router = Router()
export interface ServerBody {
  id: string
  name: string
}

export interface MemberBody {
  user: DiscordUser
  serverId: string
  roles: string[]
}

router.post('/user', async (req, res) => {
  const body: MemberBody = req.body

  try {
    await updateUser(body)
    res.sendStatus(204)
  } catch (err) {
    logger.error('Error updating user', {
      name: body.user.username,
      id: body.user.id,
      error: {
        error: JSON.stringify(err),
        trace: err.stack,
      },
    })

    res.sendStatus(500)
  }
})

router.delete('/user', async (req, res) => {
  const body: MemberBody = req.body

  try {
    await removeUserRoles(body)
    res.sendStatus(204)
  } catch (err) {
    logger.error('Error updating user', {
      name: body.user.username,
      id: body.user.id,
      error: {
        error: JSON.stringify(err),
        trace: err.stack,
      },
    })

    res.sendStatus(500)
  }
})

router.put('/server', async (req, res) => {
  const body: ServerBody = req.body

  try {
    await setupServer(body)
    res.sendStatus(204)
  } catch (err) {
    logger.error('Error setting up server', {
      name: body.name,
      error: {
        error: JSON.stringify(err),
        trace: err.stack,
      },
    })

    res.sendStatus(500)
  }
})

router.delete('/server', async (req, res) => {
  const body: ServerBody = req.body

  try {
    await delServer(body)
    res.sendStatus(204)
  } catch (err) {
    logger.error('Error deleting server', {
      name: body.name,
      error: {
        error: JSON.stringify(err),
        trace: err.stack,
      },
    })

    res.sendStatus(500)
  }
})

export default router
