import * as marketData from './market.tsmarketsDataNew.json'
import * as tokens from './market.tstokenData.json'

export interface BestPathAndRate {
  bestPath: number[]
  bestRate: number
}

/**
 * Router Service Class that constructs graphs of all uniswap trading pairs and computes best conversion rate with path
 */
export class RouterService {
  vertices: number
  adjList: number[][]
  allPaths: number[][] = []
  tokenAddresses: Array<string> = Object.keys(tokens)

  constructor(private readonly maxHops: number) {
    console.log(`started router service with max hops at ${maxHops}`)
    this.constructGraph()
  }

  /**
   *  A directed graph using adjacency list representation
   * @param vertices : number of verices to initialize
   */
  Graph(vertices: number) {
    this.vertices = vertices

    // initialise adjacency list
    this.initAdjList()
  }

  /**
   * Utility method to initialise adjacency list
   */
  initAdjList() {
    this.adjList = new Array(this.vertices)

    for (let i = 0; i < this.vertices; i++) {
      this.adjList[i] = []
    }
  }

  /**
   * Add edge from vertice u to vertice v
   * @param u index of source token in tokens array
   * @param v index of destination token in tokens array
   */
  addEdge(u: number, v: number) {
    // Add v to u's list.
    this.adjList[u].push(v)
  }

  /**
   * Prints all paths from s to d, t
   * Time Complexity: O(V^V), The time complexity is exponential.
   * From each vertex there are v vertices that can be visited from current vertex.
   * Auxiliary space: O(V^V), To store the paths V^V space is needed.
   * @param s index of source token in tokens array
   * @param d index of destination token in tokens array
   * @returns all paths from s to d
   */
  printAllPaths(s: number, d: number): number[][] {
    let isVisited = new Array(this.vertices)
    for (let i = 0; i < this.vertices; i++) {
      isVisited[i] = false
    }
    let pathList: number[] = []

    // add source to path[]
    pathList.push(s)

    // Call recursive utility
    this.printAllPathsUtil(s, d, isVisited, pathList, this.maxHops, [])

    return this.allPaths
  }

  /**
   *  A recursive function to print all paths from 'u' to 'd'. isVisited[] keeps track of vertices in current path.
   * localPathList<> stores actual vertices in the current path
   * @param u index of source token in tokens array
   * @param d index of destination token in tokens array
   * @param isVisited array of boolean storing if node is visited or not
   * @param localPathList current path traversed
   * @param maxHops max hops allowed to perform DFS
   * @param confirmedPaths array of confirmed paths
   * @returns
   */
  printAllPathsUtil(
    u: number,
    d: number,
    isVisited: Array<boolean>,
    localPathList: number[],
    maxHops: number,
    confirmedPaths: number[],
  ) {
    if (u == d) {
      // if match found then no need to
      // traverse more till depth
      confirmedPaths = confirmedPaths.concat(localPathList)
      this.allPaths.push(confirmedPaths)
      return
    }

    // Mark the current node
    isVisited[u] = true

    // Recur for all the vertices
    // adjacent to current vertex
    for (let i = 0; i < this.adjList[u].length; i++) {
      if (!isVisited[this.adjList[u][i]] && maxHops >= 0) {
        // store current node
        // in path[]
        localPathList.push(this.adjList[u][i])
        this.printAllPathsUtil(this.adjList[u][i], d, isVisited, localPathList, maxHops - 1, confirmedPaths)

        // remove current node
        // in path[]
        localPathList.splice(localPathList.indexOf(this.adjList[u][i]), 1)
      }
    }
    // Mark the current node
    isVisited[u] = false
  }

  /**
   * create a graph of all connected tokens(trading pairs)
   */
  constructGraph() {
    const marketPairs = marketData[0]
    this.Graph(Object.keys(tokens).length)
    for (let i = 0; i < marketPairs.length; i++) {
      const market = marketPairs[i]
      const sourceAddress = market.baseSymbolAddress
      const destAddress = market.quoteSymbolAddress
      const s = this.convertTokenAddressToNumber(sourceAddress)
      const d = this.convertTokenAddressToNumber(destAddress)
      this.addEdge(s, d)
      this.addEdge(d, s)
    }
  }

  /**
   * Get the conversion rate of a token pair
   * @param s index of input token in tokens array
   * @param d index of output token in tokens array
   * @returns conversion rate
   */
  getRate(s: number, d: number): number {
    const sourceToken = this.tokenAddresses[s]
    const destToken = this.tokenAddresses[d]
    const rate = tokens[sourceToken].rate[sourceToken + destToken]
    //console.log(`${tokens[sourceToken].symbol} to ${tokens[destToken].symbol} at rate ${rate}`)
    return rate
  }

  /**
   * Get the path with the best conversion rate among an array of paths
   * @param candidatePaths an array of all paths that can trade from input token to output token
   * @returns best rate and best path
   */
  getBestPath(candidatePaths: number[][]): BestPathAndRate {
    let bestRate = 0
    let bestPath
    for (let i = 0; i < candidatePaths.length; i++) {
      const currentPath = candidatePaths[i]
      const rateOfCurrentPath = this.getRateFromPath(currentPath)

      if (rateOfCurrentPath > bestRate) {
        bestRate = rateOfCurrentPath
        bestPath = currentPath
      }
    }
    console.log(`Best path is`, bestPath)
    bestPath = bestPath.map((element) => {
      return this.getTokenSymbol(element)
    })
    const result = { bestPath: bestPath, bestRate: bestRate } as BestPathAndRate
    console.log(`Best rate and path`, result)
    return result
  }

  getBestPathWithLog(candidatePaths: number[][]): BestPathAndRate {
    let bestRate = Number.NEGATIVE_INFINITY
    let bestPath
    for (let i = 0; i < candidatePaths.length; i++) {
      const currentPath = candidatePaths[i]
      const rateOfCurrentPath = this.getRateInLogFromPath(currentPath)

      if (rateOfCurrentPath > bestRate) {
        bestRate = rateOfCurrentPath
        bestPath = currentPath
      }
    }
    console.log(`Best path is`, bestPath)
    bestPath = bestPath.map((element) => {
      return this.getTokenSymbol(element)
    })
    const result = { bestPath: bestPath, bestRate: Math.pow(2, bestRate) } as BestPathAndRate
    console.log(`Best rate and path`, result)
    return result
  }

  /**
   * Get the conversion rate by traversing through a list of trading pairs and multiplying them
   * @param currentPath an array of index of tokens that can be traded by giving in input token and get output token out
   * @returns conversion rate
   */
  getRateFromPath(currentPath: number[]): number {
    let rateOfCurrentPath = 1
    for (let j = 0; j < currentPath.length - 1; j++) {
      const s = currentPath[j]
      const d = currentPath[j + 1]
      rateOfCurrentPath = rateOfCurrentPath * this.getRate(s, d)
    }
    return rateOfCurrentPath
  }

  /**
   * Get the conversion rate by traversing through a list of trading pairs and adding the logarithmic values
   * @param currentPath an array of index of tokens that can be traded by giving in input token and get output token out
   * @returns conversion rate
   */
  getRateInLogFromPath(currentPath: number[]): number {
    let rateOfCurrentPath = 0
    for (let j = 0; j < currentPath.length - 1; j++) {
      const s = currentPath[j]
      const d = currentPath[j + 1]
      const rate = this.getRate(s, d)
      const rateInLog = Math.log2(rate)
      rateOfCurrentPath = rateOfCurrentPath + rateInLog
    }
    return rateOfCurrentPath
  }
  /**
   * Get the best path and converions rate by providing input and output token addresses
   * @param sourceAddress input token address
   * @param destAddress output token address
   * @returns best rate and best path
   */
  getBestPathAndRate(sourceAddress: string, destAddress: string): BestPathAndRate {
    const s = this.convertTokenAddressToNumber(sourceAddress)
    const d = this.convertTokenAddressToNumber(destAddress)
    const candidatePaths = this.printAllPaths(s, d)
    const candidatePathsSymbols = candidatePaths.map((element) => {
      return element.map((i) => this.getTokenSymbol(i))
    })
    console.log('Found all possible paths are', candidatePathsSymbols)
    //return this.getBestPath(candidatePaths)
    return this.getBestPathWithLog(candidatePaths)
  }

  /**
   * get the index of token in the token address array
   * @param address token address
   * @returns number index
   */
  convertTokenAddressToNumber(address: string): number {
    const matchAddress = (element) => element === address
    const index = this.tokenAddresses.findIndex(matchAddress)
    return index
  }

  /**
   * get the token symbol by providing its index
   * @param index index of token in token address array
   * @returns symbol string
   */
  getTokenSymbol(index: number): string {
    const tokenAddress = this.tokenAddresses[index]
    return tokens[tokenAddress].symbol
  }
}
