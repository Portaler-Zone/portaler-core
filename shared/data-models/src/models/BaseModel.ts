import { QueryResult } from 'pg'

export type DBQuery = (
  query: string,
  params: (string | number | number[] | Date | boolean)[]
) => Promise<QueryResult>

export default class BaseModel {
  protected query: DBQuery

  constructor(dbQuery: DBQuery) {
    this.query = dbQuery
  }
}
