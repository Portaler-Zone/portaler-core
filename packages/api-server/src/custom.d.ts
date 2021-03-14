declare namespace Express {
  export interface Request {
    userId: number
    serverId: number
    canWrite: boolean
    isPublic: boolean
  }
}
