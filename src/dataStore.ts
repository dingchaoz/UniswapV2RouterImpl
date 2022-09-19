import { Contract } from '@ethersproject/contracts'
import { Provider } from '@ethersproject/providers'
import { Token } from '@uniswap/sdk-core'
import { abi as IERC20ABI } from '@uniswap/v2-core/build/IERC20.json'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { BigNumber } from 'ethers'

export interface Pair {
  address: string
  token0: Token
  token1: Token
  reserve0: bigint
  reserve1: bigint
}

export class DataStore {
  private readonly pairs: Map<string, Promise<Pair>> = new Map()
  private readonly tokens: Map<string, Promise<Token>> = new Map()

  constructor(private provider: Provider) {}
  fetch(pairAddress: string): Promise<Pair> {
    pairAddress = pairAddress.toLowerCase()
    const pair = this.pairs.get(pairAddress)
    if (pair) return pair

    const pairPromise = this.fetchPair(pairAddress)
    this.pairs.set(pairAddress, pairPromise)
    return pairPromise
  }

  async fetchReserves(pairAddress: string): Promise<{
    reserve0: BigNumber
    reserve1: BigNumber
    blockTimestampLast: number
  }> {
    pairAddress = pairAddress.toLowerCase()
    const pairContract = new Contract(pairAddress, IUniswapV2PairABI, this.provider)
    return await pairContract.callStatic.getReserves()
  }

  private async fetchPair(pairAddress: string): Promise<Pair> {
    pairAddress = pairAddress.toLowerCase()
    const { token0Address, token1Address } = await this.fetchImmutables(pairAddress)
    const { reserve0, reserve1 } = await this.fetchReserves(pairAddress)
    const [token0, token1] = await Promise.all([this.getToken(token0Address), this.getToken(token1Address)])
    return { reserve0: reserve0.toBigInt(), reserve1: reserve1.toBigInt(), address: pairAddress, token0, token1 }
  }

  private async fetchImmutables(pairAddress: string): Promise<{
    token0Address: string
    token1Address: string
  }> {
    pairAddress = pairAddress.toLowerCase()
    const pairContract = new Contract(pairAddress, IUniswapV2PairABI, this.provider)

    const [token0Address, token1Address] = await Promise.all([
      pairContract.callStatic.token0(),
      pairContract.callStatic.token1(),
    ])

    return {
      token0Address,
      token1Address,
    }
  }

  private async getToken(tokenAddress: string): Promise<Token> {
    tokenAddress = tokenAddress.toLowerCase()
    const token = this.tokens.get(tokenAddress)
    if (token) return token

    const tokenPromise = this.fetchToken(tokenAddress)
    this.tokens.set(tokenAddress, tokenPromise)
    return tokenPromise
  }

  private cachedTokens: Record<string, Token> = {}
  private async fetchToken(tokenAddress: string): Promise<Token> {
    if (this.cachedTokens[tokenAddress] != null) {
      return this.cachedTokens[tokenAddress]
    }
    const tokenContract = new Contract(tokenAddress, IERC20ABI, this.provider)

    const [network, decimals, symbol, name] = await Promise.all([
      this.provider.getNetwork(), // in order to get the chainId from the provider
      tokenContract.callStatic.decimals().catch(() => 18),
      tokenContract.callStatic.symbol().catch(() => undefined),
      tokenContract.callStatic.name().catch(() => undefined),
    ])

    this.cachedTokens[tokenAddress] = new Token(network.chainId, tokenAddress, decimals, symbol, name)
    return this.cachedTokens[tokenAddress]
  }
}
