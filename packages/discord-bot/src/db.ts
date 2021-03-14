import getDatabases, { DatabaseConnector } from '@portaler/data-models'

import config from './config'

let db: DatabaseConnector

const getDb = async () => {
  const { db: tmpDb } = await getDatabases(config.db)

  db = tmpDb
}

export { db }
export default getDb
