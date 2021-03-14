import getDatabases, {
  DatabaseConnector,
  RedisConnector,
} from '@portaler/data-models'

import config from './config'

let db: DatabaseConnector
let redis: RedisConnector

const getDb = async () => {
  const { db: tmpDb, redis: tmpRedis } = await getDatabases(
    config.db,
    config.redis
  )

  db = tmpDb
  redis = tmpRedis!
}

export { db, redis }
export default getDb
