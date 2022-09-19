export const GRAPH_REFDATA_QUERY = (reserveUSD: number, startStamp: string) => `
query getV2StylePairs
{
  pairs(where: {reserveUSD_gte: ${reserveUSD}, createdAtTimestamp_gte :${startStamp} }, orderBy: createdAtBlockNumber, first: 1000) {
    id
    createdAtTimestamp
    reserve0
    reserve1
    token0 {
      id
      symbol
      decimals
      name
    }
    token1 {
      id
      symbol
      decimals
      name
    }
  }
}
    `
