//import * as ethers from 'ethers'
import { ethers } from 'ethers'
import { DataStore } from './dataStore'
import { Provider } from '@ethersproject/providers'
import { RefdataService } from './market'
import { RouterService } from './router'

void (async () => {
  // const url = 'https://frequent-solitary-feather.discover.quiknode.pro/a78c76418b413173b32f9c23561f941ab5c22499/'
  // const customHttpProvider = new ethers.providers.JsonRpcProvider(url) as unknown as Provider
  // customHttpProvider.getBlockNumber().then((result) => {
  //   console.log('Current block number: ' + result)
  // })

  // // v2 factory address https://etherscan.io/address/0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f#readContract

  // const market = '0x3139Ffc91B99aa94DA8A2dc13f1fC36F9BDc98eE'
  // const dataStore = new DataStore(customHttpProvider)
  // const pair = await dataStore.fetch(market)
  // //console.log(pair)
  // const GRAPH_REFDATA_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'
  // const refData = new RefdataService(GRAPH_REFDATA_URL)
  // const r = await refData.markets(10000, 1)
  // //console.log(r)

  const router = new RouterService(2)
  router.getBestPathAndRate(2, 3)
})()
