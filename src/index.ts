import * as path from 'path'
import { initRefData } from './market'
import { HttpServer } from 'tsrpc'
import { serviceProto } from './shared/protocols/serviceProto'
import { Alchemy, Network } from 'alchemy-sdk'
import { _ } from 'lodash'
import * as dotenv from 'dotenv'

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
  await server.autoImplementApi(path.resolve(__dirname, 'api'))

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
