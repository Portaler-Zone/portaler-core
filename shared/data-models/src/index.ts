import retry from 'async-retry'
import { PoolConfig } from 'pg'
import { ClientOpts } from 'redis'

import DatabaseConnector from './DatabaseConnector'
import RedisConnector from './RedisConnector'

const getDatabases = async (
  dbConfig: PoolConfig,
  redisConfig?: ClientOpts
): Promise<{
  db: DatabaseConnector
  redis?: RedisConnector
}> =>
  await retry(
    async () => {
      const db = new DatabaseConnector(dbConfig)

      const rows = await db.dbQuery('SELECT NOW();')

      if (rows.rowCount === 0) {
        throw new Error('Error connecting to db')
      }

      if (redisConfig) {
        const redis = new RedisConnector(redisConfig)

        if (redis) {
          console.log('Connected to Db & Redis')
          return { db, redis }
        } else {
          throw new Error('Error connecting to Redis')
        }
      }

      return { db }
    },
    {
      retries: 100,
      minTimeout: 100,
      maxTimeout: 1000,
      randomize: false,
      onRetry: (err, count: number) =>
        console.log(`Retrying db connection ${count}`, err),
    }
  )

export { DatabaseConnector, RedisConnector }
export { IServerModel } from './models/Server'
export { IUserModel, DiscordUser } from './models/User'

export default getDatabases
