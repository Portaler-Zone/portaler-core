import createLogger, { WinstonLog } from '@portaler/logger'

import { db } from './db'

const logger = createLogger(process.env.SERVICE ?? 'api-server')

logger.on('data', async (info: WinstonLog) => {
  try {
    await db.Logs.winstonLog(info)
  } catch (err) {
    console.error(err)
  }
})

export default logger
