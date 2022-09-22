## Table of content

- [Setup](#Setup)
    - [Installation](#Installation)
    - [Environemnt file setup](#Env)
    - [Start rpc-server](#RPC-Server-run)
    - [Start rpc-client](#RPC-Client-run)
    - [Router RPC Server-Client Demo](#Demo)
    - [Test](#Test)
- [Design](#Design)
    - [Market Data](#Market-Data)
        - [Comparison of different market data fetching methods](#Why-Use-Graph)
        - [How do we choose what pools to consider](#filtering-criteria)
    - [Router algorithm](#Routing)
        -[Assumptions](#assumption)
        -[How to get all possibe paths](#get-all-paths)
        -[How to get the best path](#compute-best-path)
- [Router peformance analysis](#analsyis)
- [Future work](#Future-improvement)

## Setup

- ### Installation
    `npm install`
- ### Env
    Copy `.env.example` and save it into `.env`, and add your ALCHEMY_KEY from Ethereuem mainnet app and optionally configure other variables:MINIMUM_RESERVEUSD, MINIMUM_TIMESTAMP explained in [market data](#Market-Data)
- ### RPC-Server-run
    `npm run rpc-dev`
- ### RPC-Client-run

    The request message is an implementation of following interface
    ```
    interface ReqRouter {
    inputToken: string // the address of input token to be traded in 
    outputToken: string // the address of output token to be traded out
    maxHops: number // the number of max hops from input token to output token, e.g. [WETH->USDT->USDC] has a 1 hop
    }
    ```
    An example requst the best rate and trading path of 0 hops(direct swap) from inputToken WETH to outputToken DAI:

    `curl -H "Content-Type: application/json" -X POST -d '{"inputToken": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","outputToken": "0x6b175474e89094c44da98b954eedeac495271d0f", "maxHops" :0}' http://127.0.0.1:3000/Router`

    The return message implments the following interface

    ```
    interface ResRouter {
    rate: number // conversion rate of the best trading path
    bestPath: string[] // best trading path consisting of token symbols
    time: Date //timestamp
    }

    ```
    Example response from RPC server
    ```
    {"isSucc":true,"res":{"rate":1290.3545770099151,"bestPath":["WETH","DAI"],"time":"2022-09-23T01:22:55.943Z"}}
    ```

- ### Demo

![test ](https://raw.githubusercontent.com/dingchaoz/UniswapV2RouterImpl/rpc/demo.gif)

- ### Test

    `npm run test`

## Design 

- ### Market-Data
    All uniswap pairs and tokens meta data are retrieved from the Graph protocol in the backend, and gets updated at every block in receiving event of a new block header from Alchemy node provider.

    Pairs/Market data consist of following properties: 

    ```
    interface Market {
        address: string 
        baseSymbol: string
        baseSymbolAddress: string
        quoteSymbol: string
        quoteSymbolAddress: string
        feeBips: number
        baseSymbolDecimals: number
        quoteSymbolDecimals: number
        creationTime: number
        identifier: string // pool address
        baseSymbolName: string
        quoteSymbolName: string
        reserve0: string
        reserve1: string
    }
    ``` 

    Tokens data consist of the following properties, the rate is a Map takes key as the current token address + the output token address, and value as the reserve division from the current token to the other output token:
    ```
    {
        symbol: string // token symbol
        name: string // token anme
        rate: Map<String, number> 
      }
    ```

    #### Why-Use-Graph

    The Graph protocol indexing uniswap events and logs data makes it easy to pull a batch of all pairs and tokens information in a few batch API calls, compared to making RPC calls from Ethereuem node to smart contracts directly, this method is much more efficient and faster.

    The downside of using Graph is it takes about 5 or more seconds to get all pairs pulled, depending on the filtering criteria.

    ### Filtering-criteria
    Most AMM pools have small liquidity and will result in large slippage when executing, and also there can be potentially scammy/unsecure pools which can implement malicious code if our smart contracts interact with them, so it is wise to filter out small and illegitimate pools.  

    As a start, devs can config the mininum dollar amount of reserve: `MINIMUM_RESERVEUSD` in .env so that only pools' notional reserve value larger than that threshold will be pulled in.


- ### Routing
    - ### Assumption
    1. We assume trading amount will not be splitted among multiple paths, instead all amount will be traded through a single best route recommended by the routing algorithm.

    2. We also assume maximixing the output amount from a certain input amount is not in current scope, and we only recommend best path that produces the best conversion rate; and input amount is not part of client request message

    3. We assume all pools have enough liquidity, this is derived from assumption 2 as we are not interested in getting the best conversion rate in the current scope

    - ### Get-all-paths
    A depth first search(DFS) with configurable max depths(`maxHops`) is implemented iteratively to identify all trading paths from input token to output token.

    - ### Compute-best-path
    Once all possible paths are generated, the server will get each two adjacent token's conversion rate from the processed market data pulled from the Graph: r1, r2, ...rx

    Then converts the maximum search of multiplication search into a addition problem by using Logarithm property
    ```
    log(r1*r2*r3...*rx) = log(r1) + log(r2) + log(r3) + ...+ log(rx)
    ```
    By converting to addition search, the computation can be more efficient and the chance of overflow and underflow is also much lower.

## Analysis

- ### 

## Future-improvement

  - Subscribe to `sync` events to update pairs reserve data, which shall be faster than refetching from the Graph protocol 
  - Subsribe to `Initialize` events to get any new created pools as fast as they are created, as the time data indexing of Graph protocol took may produce undesired latency that make our market data out of updated for a few blocks
  - Implement splittable multiple path finding algorithm
  - Implement algorithm that maximums output amount from certain input amount, and considers the liqudity of each pool.




