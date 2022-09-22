import { ethers } from 'ethers'

export class Utils {
  /**
   * eth_getLogs
   * filter by the address and topics
   * @param provider
   * @param fromBlock
   * @param toBlock
   * @param addresses
   * @param topics
   */
  public static getLogs(provider: ethers.providers.Provider, fromBlock, toBlock, addresses, topics) {
    if (fromBlock > toBlock) {
      fromBlock = toBlock
    }
    return provider.getLogs({
      fromBlock: fromBlock,
      toBlock: toBlock,
      address: addresses,
      topics: topics,
    })
  }

  public static async getCallerFromLog(provider: ethers.providers.Provider, log: ethers.providers.Log) {
    const tx = await provider.getTransaction(log.transactionHash) //FYI: Alchemy CU = 17
    return tx.from.toLowerCase()
  }

  public static wait(timeout: number) {
    return new Promise((resolve) => setTimeout(resolve, timeout))
  }

  public static withTimeout<T>(p: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      p,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeout)
      }) as any,
    ])
  }

  public static async withRetry(maxAttempt: number, delay: number, call, onFail?: (e) => any) {
    let i = 0
    let error
    while (i++ < maxAttempt) {
      try {
        return await call()
      } catch (e) {
        error = e
        console.log(`Retrying at ${i} time`)
        await new Promise((f) => setTimeout(f, delay))
      }
    }
    if (onFail !== undefined) {
      return onFail(error)
    } else {
      throw error
    }
  }

  public static delay = (ms) => new Promise((res) => setTimeout(res, ms))

  public static getAmountOut(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    amountInMul = BigInt(9970),
    reserveInMul = BigInt(10000),
  ) {
    const amountInWithFee = amountIn * amountInMul
    const numerator = amountInWithFee * reserveOut
    const denominator = reserveIn * reserveInMul + amountInWithFee
    return numerator / denominator
  }
  
  public static getAmountIn(
    amountOut: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    denominatorScale = BigInt(9970),
    numeratorScale = BigInt(10000),
  ) {
    const numerator = reserveIn * amountOut * numeratorScale
    const denominator = (reserveOut - amountOut) * denominatorScale
    return numerator / denominator + BigInt(1)
  }
}
