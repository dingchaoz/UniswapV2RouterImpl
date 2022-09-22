import * as marketData from './market.tsmarketsData.json'
import * as tokens from './market.tstokenData.json'

export class RouterService {
  private v
  private adjList
  private allPaths: any[] = []

  constructor(private readonly maxHops: number) {
    console.log(`started router service with max hops at ${maxHops}`)
    this.constructGraph()
  }

  // A directed graph using
  // adjacency list representation
  Graph(vertices: number) {
    this.v = vertices

    // initialise adjacency list
    this.initAdjList()
  }

  // utility method to initialise
  // adjacency list
  initAdjList() {
    this.adjList = new Array(this.v)

    for (let i = 0; i < this.v; i++) {
      this.adjList[i] = []
    }
  }

  // add edge from u to v
  addEdge(u, v) {
    // Add v to u's list.
    this.adjList[u].push(v)
  }

  // Prints all paths from
  // Time Complexity: O(V^V), The time complexity is exponential. From each vertex there are v vertices that can be visited from current vertex.
  // Auxiliary space: O(V^V), To store the paths V^V space is needed.
  // 's' to 'd'
  printAllPaths(s: number, d: number) {
    let isVisited = new Array(this.v)
    for (let i = 0; i < this.v; i++) {
      isVisited[i] = false
    }
    let pathList: Number[] = []

    // add source to path[]
    pathList.push(s)

    // Call recursive utility
    this.printAllPathsUtil(s, d, isVisited, pathList, this.maxHops, [])

    return this.allPaths
  }

  // A recursive function to print
  // all paths from 'u' to 'd'.
  // isVisited[] keeps track of
  // vertices in current path.
  // localPathList<> stores actual
  // vertices in the current path

  printAllPathsUtil(u, d, isVisited, localPathList: any[], maxHops, candidatePaths: any[]) {
    if (u == d) {
      // if match found then no need to
      // traverse more till depth
      //console.log(`find path`, localPathList)
      candidatePaths = candidatePaths.concat(localPathList)
      this.allPaths.push(candidatePaths)
      //console.log(`final results atm updated `,this.allPaths)
      //return results
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
        //console.log(`all paths atm in the loop are ${allPaths}`)
        localPathList.push(this.adjList[u][i])
        this.printAllPathsUtil(this.adjList[u][i], d, isVisited, localPathList, maxHops - 1, candidatePaths)

        // remove current node
        // in path[]
        localPathList.splice(localPathList.indexOf(this.adjList[u][i]), 1)
      }
    }
    // Mark the current node
    isVisited[u] = false
  }

  constructGraph() {
    const marketPairs = marketData[0]
    this.Graph(Object.keys(tokens).length)
    const tokenAddresses = Object.keys(tokens)

    for (let i = 0; i < marketPairs.length; i++) {
      const market = marketPairs[i]
      const sourceAddress = market.baseSymbolAddress
      const destAddress = market.quoteSymbolAddress
      let matchAddress = (element) => element === sourceAddress
      const s = tokenAddresses.findIndex(matchAddress)
      matchAddress = (element) => element === destAddress
      const d = tokenAddresses.findIndex(matchAddress)
      //console.log(`s is ${s}, d is ${d}`)
      this.addEdge(s, d)
      this.addEdge(d, s)
    }
  }

  getRate(s: number, d: number) {
    const tokenAddresses = Object.keys(tokens)
    const sourceToken = tokenAddresses[s]
    const destToken = tokenAddresses[d]
    const rate = tokens[destToken].reserve / tokens[sourceToken].reserve
    //console.log(tokens[sourceToken].reserve, tokens[destToken].reserve, rate)
    return rate
  }

  getBestPath(candidatePaths: any[]) {
    let bestRate = 0
    let bestPath
    for (let i = 0; i < candidatePaths.length; i++) {
      let rateOfCurrentPath = 1
      const currentPath = candidatePaths[i]

      for (let j = 0; j < currentPath.length - 1; j++) {
        const s = currentPath[j]
        const d = currentPath[j + 1]
        rateOfCurrentPath = rateOfCurrentPath * this.getRate(s, d)
      }

      if (rateOfCurrentPath > bestRate) {
        bestRate = rateOfCurrentPath
        bestPath = currentPath
      }
    }
    const result = { bestPath: bestPath, bestRate: bestRate }
    console.log(result)
    return result
  }

  getBestPathAndRate(s: number, d: number) {
    const candidatePaths = this.printAllPaths(s, d)
    console.log('Found all possible paths are', candidatePaths)
    return this.getBestPath(candidatePaths)
  }
}

const router = new RouterService(2)
router.getBestPathAndRate(2, 3)
