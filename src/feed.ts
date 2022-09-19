// Question 1:
// Implement an RPC service that takes a token pair as the input and returns their rate from the
// Uniswap v2 contract on Ethereum mainnet.
// Input: (A, B)
// Output: 0.3 // rate
// ● The primary purpose of this question is to see how you implement this service and test it.
// It’ll also be relevant for the second question.
// ● You can use a service such as Infura or Alchemy to reach mainnet
// ● If no pool is available for the token pair, you can return an error message.
// ● In Uniswap v2 there is not more than 1 pool per token pair.
// ● Testing and validation is a part of the assignment
import { default as BigNumber, default as BN } from 'bignumber.js'

function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  amountInMul = BigInt(9970),
  reserveInMul = BigInt(10000),
) {
  const amountInWithFee = amountIn * amountInMul
  const numerator = amountInWithFee * reserveOut
  const denominator = reserveIn * reserveInMul + amountInWithFee
  return numerator / denominator
}

function getAmountIn(
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  denominatorScale = BigInt(9970),
  numeratorScale = BigInt(10000),
) {
  const numerator = reserveIn * amountOut * numeratorScale
  const denominator = (reserveOut - amountOut) * denominatorScale
  return numerator / denominator + BigInt(1)
}
