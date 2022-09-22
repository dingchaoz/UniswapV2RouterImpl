export interface ReqRouter {
  inputToken: string
  outputToken: string
  maxHops: number
}

export interface ResRouter {
  rate: number
  bestPath: string[]
  time: Date
}
