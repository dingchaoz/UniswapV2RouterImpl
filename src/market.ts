import { GRAPH_REFDATA_QUERY } from './constant'
import { Utils } from './utils'
import fetch from 'node-fetch'
import fs from 'fs'

export interface Market {
  address: string
  baseSymbol: string
  baseSymbolAddress: string
  quoteSymbol: string
  quoteSymbolAddress: string
  feeBips: number
  baseSymbolDecimals: number
  quoteSymbolDecimals: number
  creationTime: number
  identifier: string
  baseSymbolName: string
  quoteSymbolName: string
  reserve0: string
  reserve1: string
}

export interface MarketsResponse {
  data: {
    pairs: Array<{
      id: string
      createdAtTimestamp: string
      reserve0: string
      reserve1: string
      token0: {
        id: string
        symbol: string
        decimals: string
        name: string
      }
      token1: {
        id: string
        symbol: string
        decimals: string
        name: string
      }
    }>
  }
}

export class RefdataService {
  // timestamp of last element in page
  pagePoint

  constructor(private readonly refdataUrl: string) {
    console.log('started EVMRefdataService')
  }

  async markets(reserveUSD: number, timestamp: number) {
    let shouldContinue = true
    const perPage = 1000
    let marketsArray: Market[] = []
    let markets
    let nextBatchStartTimestamp = timestamp
    while (shouldContinue) {
      try {
        markets = await Utils.withRetry(3, 3000, () => {
          return this.post(reserveUSD, nextBatchStartTimestamp.toString())
        })
        console.log(`Retrieved ${markets.length} Market records`)
        nextBatchStartTimestamp = markets[markets.length - 1].creationTime
        marketsArray.push(markets)
      } catch (e) {
        console.log(`Reached max attempts to get markets, stopping due to:${e}`)
        break
      }
      shouldContinue = markets.length === perPage
    }
    fs.writeFile(__filename + 'marketsData.json', JSON.stringify(marketsArray), function (err) {
      if (err) {
        console.log(err)
      }
    })
  }

  private static getQuery(reserveUSD: number, timestamp: string) {
    // Override the query if it's different from the standard Uni V2 subgraph
    const queryOverride = process.env.REFDATA_QUERY_OVERRIDE
    if (queryOverride) {
      return queryOverride.replace('%reserveUSD', reserveUSD.toString())
    }
    return GRAPH_REFDATA_QUERY(reserveUSD, timestamp)
  }

  private async post(reserveUSD: number, timestamp: string): Promise<Market[]> {
    const body = JSON.stringify({
      query: RefdataService.getQuery(reserveUSD, timestamp),
    })
    console.log(`Posting body ${body}`)
    const res = await fetch(this.refdataUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    }).catch((reason) => {
      throw new Error(`Failed to query refdata endpoint! Err: ${reason}`)
    })
    const json = await res.json().catch((reason) => {
      throw new Error(`Failed to JSON serialize refdata response! Err: ${reason}`)
    })
    return this.processResponse(json as MarketsResponse).catch((reason) => {
      throw new Error(`Failed to retrieve Market from Json: ${JSON.stringify(json)}. Reason: ${reason}`)
    })
  }

  private async processResponse(markets: MarketsResponse): Promise<Market[]> {
    return markets.data.pairs.map((market) => {
      // Switch between abnormal and normal response appropriately
      const token0Decimals = parseInt(market.token0.decimals)
      const token1Decimals = parseInt(market.token1.decimals)
      const creationMillis = parseInt(market.createdAtTimestamp)
      const marketObj = {
        address: market.id,
        baseSymbol: market.token0.symbol,
        baseSymbolAddress: market.token0.id,
        quoteSymbol: market.token1.symbol,
        quoteSymbolAddress: market.token1.id,
        feeBips: 30,
        baseSymbolDecimals: token0Decimals,
        quoteSymbolDecimals: token1Decimals,
        creationTime: creationMillis,
        identifier: market.id,
        baseSymbolName: market.token0.name,
        quoteSymbolName: market.token1.name,
        reserve0: market.reserve0,
        reserve1: market.reserve1,
      } as Market
      this.pagePoint = market.createdAtTimestamp
      return marketObj
    })
  }
}
