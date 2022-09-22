import { GRAPH_REFDATA_QUERY } from './constant'
import { Utils } from './utils'
import fetch from 'node-fetch'
import fs from 'fs'
import BigNumber from 'bignumber.js'

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

/**
 * Service class to pull and process all the uniswapv2 markets/pairs and tokens data
 */
export class RefdataService {
  // Dict to hold tokens data info
  private tokens = {}

  /**
   *
   * @param refdataUrl :the graph url for uniswapv2, each blockchain will have a different url
   */
  constructor(private readonly refdataUrl: string) {
    console.log('started RefdataService')
  }

  /**
   * Main function to get all the markets and tokens information, saved into local files for routing analysis
   * @param reserveUSD we fetch markets only if the pool's reserveInUSD is bigger than this threshold, pools of low liquidity will be not pulled
   * @param timestamp  we fetch markets if the created timestamp is newer than this threshold, this will be useful in pulling latest new pools
   */
  async markets(reserveUSD: number, timestamp: number) {
    let shouldContinue = true
    const perPage = 1000
    let marketsArray: Market[] = []
    this.tokens = {}
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

    for (const key of Object.keys(this.tokens)) {
      this.tokens[key].rate = Object.fromEntries(this.tokens[key].rate)
    }
    this.writeData(this.tokens, 'tokenData.json')
    this.writeData(marketsArray, 'marketsDataNew.json')
  }

  /**
   * Get graph query according to the reserveusd and timestamp thresholds
   * @param reserveUSD we fetch markets only if the pool's reserveInUSD is bigger than this threshold, pools of low liquidity will be not pulled
   * @param timestamp  we fetch markets if the created timestamp is newer than this threshold, this will be useful in pulling latest new pools
   * @returns a customized graph query
   */
  private static getQuery(reserveUSD: number, timestamp: string): string {
    const queryOverride = process.env.REFDATA_QUERY_OVERRIDE
    if (queryOverride) {
      return queryOverride.replace('%reserveUSD', reserveUSD.toString())
    }
    return GRAPH_REFDATA_QUERY(reserveUSD, timestamp)
  }

  /**
   * Post request to fetch and process market data
   * @param reserveUSD we fetch markets only if the pool's reserveInUSD is bigger than this threshold, pools of low liquidity will be not pulled
   * @param timestamp  we fetch markets if the created timestamp is newer than this threshold, this will be useful in pulling latest new pools
   * @returns a customized graph query
   */
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

  /**
   * Extract token information from market pools, and store token's conversion ratio in pools tokens are part of the pair
   * @param market pool address
   */
  private extractToken(market: Market) {
    let address = market.baseSymbolAddress
    if (!(address in this.tokens)) {
      this.tokens[address] = { symbol: market.baseSymbol, name: market.baseSymbolName, rate: new Map<String, number>() }
    }
    let rate = new BigNumber(market.reserve1).dividedBy(new BigNumber(market.reserve0))
    this.tokens[address].rate.set(market.baseSymbolAddress + market.quoteSymbolAddress, rate.toString())
    address = market.quoteSymbolAddress
    if (!(address in this.tokens)) {
      this.tokens[address] = {
        symbol: market.quoteSymbol,
        name: market.quoteSymbolName,
        rate: new Map<String, number>(),
      }
    }
    rate = new BigNumber(market.reserve0).dividedBy(new BigNumber(market.reserve1))
    this.tokens[address].rate.set(market.quoteSymbolAddress + market.baseSymbolAddress, rate.toString())
  }

  /**
   * Save data locally
   * @param data data to be writen
   * @param fileName file name to be saved
   */
  private writeData(data, fileName) {
    fs.writeFile(__filename + fileName, JSON.stringify(data), function (err) {
      if (err) {
        console.log(err)
      }
    })
  }

  /**
   * Process graph repsponse to save markets and tokens infor to the desired formats for later analysis
   * @param markets response from graph api post request
   * @returns
   */
  private async processResponse(markets: MarketsResponse): Promise<Market[]> {
    return markets.data.pairs.map((market) => {
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
      this.extractToken(marketObj)

      return marketObj
    })
  }
}

export function initRefData() {
  const GRAPH_REFDATA_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'
  return new RefdataService(GRAPH_REFDATA_URL)
}
