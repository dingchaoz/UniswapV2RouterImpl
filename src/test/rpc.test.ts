import * as path from 'path'
import { initRefData } from '../market'
import { HttpServer } from 'tsrpc'
import { serviceProto } from '../shared/protocols/serviceProto'
import { Alchemy, Network } from 'alchemy-sdk'
import { _ } from 'lodash'
import * as dotenv from 'dotenv'
import fetch from 'node-fetch'

dotenv.config()

// Create the Server
const server = new HttpServer(serviceProto, {
  port: 3000,
  json: true,
})

const alchemyProvider = initProvider()

const refData = initRefData()

const MINIMUM_RESERVEUSD = parseInt(process.env.MINIMUM_RESERVEUSD!) || 10000

const MINIMUM_TIMESTAMP = parseInt(process.env.MINIMUM_TIMESTAMP!) || 1

// Entry function
async function main() {
  // Auto implement APIs
  await server.autoImplementApi(path.join(__dirname, '..','api'))

  // update market and tokens reference data on every new block
  // _throttle implements a queue to store new block events and set a delay to assure each new ref data is completed
  alchemyProvider.ws.on('block', _.throttle(updateRefData, 50000))

  await server.start()
}

async function updateRefData(blockNumber) {
  console.log(`latest block number is ${blockNumber}`)
  await refData.markets(MINIMUM_RESERVEUSD, MINIMUM_TIMESTAMP)
}

function initProvider() {
  if (!process.env.ALCHEMY_KEY) {
    throw new Error('ALCHEMY_KEY not set.')
  }
  const settings = {
    apiKey: process.env.ALCHEMY_KEY,
    network: Network.ETH_MAINNET,
  }

  return new Alchemy(settings)
}

main().catch((e) => {
    // Exit if any error during the startup
    server.logger.error(e)
    process.exit(-1)
  })


describe('testing rpc server working properly', () => {
    
    const url = 'http://127.0.0.1:3000/Router' 
  
    it('should return 2 hop path back from a maxHop2 best rate path finding request', async() => {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: '{"inputToken": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","outputToken": "0x6b175474e89094c44da98b954eedeac495271d0f", "maxHops" :2}'
          }).catch((reason) => {
            throw new Error(`Failed to query refdata endpoint! Err: ${reason}`)
          })
    
        const json = await res.json().catch((reason) => {
            throw new Error(`Failed to JSON serialize refdata response! Err: ${reason}`)
          })
        console.log(`rpc response`,json)
      
        expect(json.res.bestPath.length - 2).toBeLessThanOrEqual(2)
    })

  })


