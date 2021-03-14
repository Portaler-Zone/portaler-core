import getDatabases, {
  DatabaseConnector,
  RedisConnector,
} from '@portaler/data-models'

const config = {
  db: {
    host: process.env.DB_HOST!,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
    port: Number(process.env.DB_PORT || 5432),
  },
  redis: {
    host: process.env.REDIS_HOST!,
    password: process.env.REDIS_PASSWORD!,
    port: Number(process.env.REDIS_PORT || 6379),
  },
}

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
