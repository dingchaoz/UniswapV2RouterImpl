import { RouterService } from '../router'
import { Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import { DataStore } from '../dataStore'
import { initRefData } from '../market'
import { BigNumber } from 'ethers'
import * as dotenv from 'dotenv'

dotenv.config()

const url = 'https://frequent-solitary-feather.discover.quiknode.pro/a78c76418b413173b32f9c23561f941ab5c22499/'
const provider = new ethers.providers.JsonRpcProvider(url) as unknown as Provider
const dataStore = new DataStore(provider)
const refData = initRefData()
const MINIMUM_RESERVEUSD = parseInt(process.env.MINIMUM_RESERVEUSD!) || 10000
const MINIMUM_TIMESTAMP = parseInt(process.env.MINIMUM_TIMESTAMP!) || 1
void (async () => {
  refData.markets(MINIMUM_RESERVEUSD, MINIMUM_TIMESTAMP)
})()

describe('testing router service with direct swap', () => {
  const router = new RouterService(0)
  const sourceToken = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' //WETH
  const destToken = '0x6b175474e89094c44da98b954eedeac495271d0f' //DAI

  it('should return direct token pairs as the best path ', () => {
    const results = router.getBestPathAndRate(sourceToken, destToken)
    expect(results.bestPath).toStrictEqual(['WETH', 'DAI'])
  })

  it('should return rate close to what we get from calling smart contracts ', async () => {
    const results = router.getBestPathAndRate(sourceToken, destToken)
    const market = '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11' //WETH-DAI pool address
    const pair = await dataStore.fetch(market)
    const rateFromContract = Number((pair.reserve0 * 100n) / pair.reserve1) / 100
    const diff = Math.abs(rateFromContract - results.bestRate) / results.bestRate
    expect(diff).toBeLessThan(0.01)
  })
})

describe('testing router service with multiple hops swap', () => {
    
    const sourceToken = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' //WETH
    const destToken = '0x6b175474e89094c44da98b954eedeac495271d0f' //DAI
  
    it('When maxHops =2, should return paths of containing no more than 2 hops ', () => {
      const router = new RouterService(2)
      const results = router.getBestPathAndRate(sourceToken, destToken)
      expect(results.bestPath.length - 2).toBeLessThanOrEqual(2)
    })
  
    it('When maxHops =3, should return paths of containing no more than 3 hops ', () => {
        const router = new RouterService(3)
        const results = router.getBestPathAndRate(sourceToken, destToken)
        expect(results.bestPath.length - 2).toBeLessThanOrEqual(3)
      })
  })
