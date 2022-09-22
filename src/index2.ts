//import * as ethers from 'ethers'
import { ethers } from 'ethers'
import { DataStore } from './dataStore'
import { Provider } from '@ethersproject/providers'
import { RefdataService } from './market'
import { RouterService } from './router'
import { performance } from 'perf_hooks'

void (async () => {
  const url = 'https://frequent-solitary-feather.discover.quiknode.pro/a78c76418b413173b32f9c23561f941ab5c22499/'
  const customHttpProvider = new ethers.providers.JsonRpcProvider(url) as unknown as Provider
  customHttpProvider.getBlockNumber().then((result) => {
    console.log('Current block number: ' + result)
  })

  // // v2 factory address https://etherscan.io/address/0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f#readContract

  const market = '0x3139Ffc91B99aa94DA8A2dc13f1fC36F9BDc98eE'
  const dataStore = new DataStore(customHttpProvider)
  const pair = await dataStore.fetch(market)
  console.log(pair)
  // const GRAPH_REFDATA_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'
  // const refData = new RefdataService(GRAPH_REFDATA_URL)
  // await refData.markets(10000, 1)

  // const router = new RouterService(2)
  // //const destToken = '0x0d8775f648430679a709e98d2b0cb6250d2887ef' //BAT
  // const sourceToken = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' //WETH
  // const destToken = '0x6b175474e89094c44da98b954eedeac495271d0f' //DAI
  // const startTime = performance.now()
  // router.getBestPathAndRate(sourceToken, destToken)
  // const endTime = performance.now()
  // console.log('it took this many milliseconds', endTime - startTime)
})()
