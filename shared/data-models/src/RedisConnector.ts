import redis, { ClientOpts, RedisClient } from 'redis'
import { promisify } from 'util'

import { Zone } from '@portaler/types'

type ExpireTimes = 'EX' | 'PX' | 'NX' | 'XX' | 'KEEPTTL' | 'GET'

export default class RedisConnector {
  client: RedisClient
  getAsync: (key: string) => Promise<any>
  setAsync: (
    key: string,
    value: string,
    mode?: ExpireTimes,
    expires?: number
  ) => Promise<any>
  delAsync: (key: string) => Promise<any>

  constructor(config: ClientOpts) {
    this.client = redis.createClient({
      ...config,
      retry_strategy: ({ error }) => this.client.emit('error', error),
    })

    this.getAsync = promisify(this.client.get).bind(this.client)
    this.setAsync = promisify(this.client.set).bind(this.client)
    this.delAsync = promisify(this.client.del).bind(this.client)
  }

  setUser = async (
    token: string,
    userId: number,
    serverId: number,
    isReadOnly: boolean
  ) => {
    const hasUser = await this.getUser(`${userId}:${serverId}`)

    if (hasUser) {
      await this.delUser(hasUser, userId, serverId)
    }

    return await Promise.all([
      this.setAsync(token, `${userId}:${serverId}:${isReadOnly}`),
      this.setAsync(`${userId}:${serverId}`, token),
    ])
  }

  getUser = async (token: string): Promise<string> => await this.getAsync(token)

  getToken = async (userId: number, serverId: number) =>
    await this.getAsync(`${userId}:${serverId}`)

  delUser = async (token: string, userId: number, serverId: number) =>
    await Promise.all([
      this.delAsync(token),
      this.delAsync(`${userId}:${serverId}`),
    ])

  delServer = async (serverId: number, userIds: number[]) => {
    const tokenList = await Promise.all(
      userIds.map((uid) => this.getToken(uid, serverId))
    )

    const promiseList = []

    if (tokenList) {
      const delTokens = tokenList.map((t) => this.delAsync(t))
      const delUsers = userIds.map((uid) => this.delAsync(`${uid}:${serverId}`))

      promiseList.push([...delTokens, ...delUsers])
    }

    const subdomain = this.getAsync(`server:${serverId}`)
    const delServer = this.delAsync(`server:${serverId}`)

    promiseList.push(delServer)
    promiseList.push(this.delAsync(`server:${subdomain}`))

    await Promise.all(promiseList)
  }

  setZones = async (zones: Zone[]) =>
    await this.setAsync('zones', JSON.stringify(zones))

  getZones = async () => await this.getAsync('zones')

  setZone = async (zone: Zone) =>
    await this.setAsync(`zone:${zone.id}`, JSON.stringify(zone), 'EX', 7200)

  getZone = async (id: number) => await this.getAsync(`zone:${id}`)
}
