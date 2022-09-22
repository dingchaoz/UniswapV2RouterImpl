import { ApiCall } from 'tsrpc'
import { ReqRouter, ResRouter } from '../shared/protocols/PtlRouter'
import { RouterService } from '../router'

export async function ApiRouter(call: ApiCall<ReqRouter, ResRouter>) {
  const sourceToken = call.req.inputToken
  const destToken = call.req.outputToken
  const router = new RouterService(call.req.maxHops)
  const res = router.getBestPathAndRate(sourceToken, destToken)
  if (res !== undefined) {
    call.succ({
      rate: res.bestRate,
      bestPath: res.bestPath,
      time: new Date(),
    })
  } else {
    call.error('Invalid tokens')
  }
}
