import * as data from './market.tsmarketsData.json'

//console.log(JSON.stringify(data[0][0]))

let v

let adjList

let results: any[] = []

const maxHops = 2

// Time Complexity: O(V^V), The time complexity is exponential. From each vertex there are v vertices that can be visited from current vertex.
// Auxiliary space: O(V^V), To store the paths V^V space is needed.

// function to find all routes from a to b, with x hops

// A directed graph using
// adjacency list representation
function Graph(vertices: number) {
  v = vertices

  // initialise adjacency list
  initAdjList()
}

// utility method to initialise
// adjacency list
function initAdjList() {
  adjList = new Array(v)

  for (let i = 0; i < v; i++) {
    adjList[i] = []
  }
}

// add edge from u to v
function addEdge(u, v) {
  // Add v to u's list.
  adjList[u].push(v)
}

// Prints all paths from
// 's' to 'd'
function printAllPaths(s: number, d: number) {
  let isVisited = new Array(v)
  for (let i = 0; i < v; i++) {
    isVisited[i] = false
  }
  let pathList: Number[] = []

  // add source to path[]
  pathList.push(s)

  // Call recursive utility
  printAllPathsUtil(s, d, isVisited, pathList, maxHops, [])

  return results
}

// A recursive function to print
// all paths from 'u' to 'd'.
// isVisited[] keeps track of
// vertices in current path.
// localPathList<> stores actual
// vertices in the current path
function printAllPathsUtil(u, d, isVisited, localPathList: any[], maxHops, candidatePaths: any[]) {
  if (u == d) {
    // if match found then no need to
    // traverse more till depth
    console.log(`find path`, localPathList)
    candidatePaths = candidatePaths.concat(localPathList)
    results.push(candidatePaths)
    console.log(`final results atm updated are ${results}`)
    //return results
    return
  }

  // Mark the current node
  isVisited[u] = true

  // Recur for all the vertices
  // adjacent to current vertex
  for (let i = 0; i < adjList[u].length; i++) {
    if (!isVisited[adjList[u][i]] && maxHops >= 0) {
      // store current node
      // in path[]
      //console.log(`all paths atm in the loop are ${allPaths}`)
      localPathList.push(adjList[u][i])
      printAllPathsUtil(adjList[u][i], d, isVisited, localPathList, maxHops - 1, candidatePaths)

      // remove current node
      // in path[]
      localPathList.splice(localPathList.indexOf(adjList[u][i]), 1)
    }
  }
  // Mark the current node
  isVisited[u] = false

  //return allPaths
}

// Driver program
// Create a sample graph
// Graph(4);
// addEdge(0, 1);
// addEdge(0, 2);
// addEdge(0, 3);
// addEdge(2, 0);
// addEdge(2, 1);
// addEdge(1, 3);

// // arbitrary source
// let s = 2;

// // arbitrary destination
// let d = 3;

//printAllPaths(s, d)

const tokens = {}
const marketPairs = data[0]

for (let i = 0; i < marketPairs.length; i++) {
  const market = marketPairs[i]
  let address = market.baseSymbolAddress
  if (!(address in tokens)) {
    tokens[address] = { symbol: market.baseSymbol, name: market.baseSymbolName, reserve: market.reserve0 }
  }
  address = market.quoteSymbolAddress
  if (!(address in tokens)) {
    tokens[address] = { symbol: market.quoteSymbol, name: market.quoteSymbolName, reserve: market.reserve1 }
  }
}

Graph(Object.keys(tokens).length)
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
  addEdge(s, d)
  addEdge(d, s)
}

// arbitrary source
let s = 2

// arbitrary destination
let d = 3

const allPaths = printAllPaths(s, d)
console.log('final results are', allPaths)

function getRate(s: number, d: number) {
  const tokenAddresses = Object.keys(tokens)
  const sourceToken = tokenAddresses[s]
  const destToken = tokenAddresses[d]
  const rate = tokens[destToken].reserve / tokens[sourceToken].reserve
  console.log(tokens[sourceToken].reserve, tokens[destToken].reserve, rate)
  return rate
}

function getBestPath(allPaths: any[]) {
  let bestRate = 0
  let bestPath
  for (let i = 0; i < allPaths.length; i++) {
    let rateOfCurrentPath = 1
    const currentPath = allPaths[i]

    for (let j = 0; j < currentPath.length - 1; j++) {
      const s = currentPath[j]
      const d = currentPath[j + 1]
      rateOfCurrentPath = rateOfCurrentPath * getRate(s, d)
    }

    if (rateOfCurrentPath > bestRate) {
      bestRate = rateOfCurrentPath
      bestPath = currentPath
    }
  }

  return { bestPath: bestPath, bestRate: bestRate }
}

console.log(getBestPath(allPaths))
