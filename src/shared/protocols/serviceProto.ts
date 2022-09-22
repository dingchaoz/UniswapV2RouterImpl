import { ServiceProto } from 'tsrpc-proto'
import { ReqRouter, ResRouter } from './PtlRouter'

export interface ServiceType {
  api: {
    Router: {
      req: ReqRouter
      res: ResRouter
    }
  }
  msg: {}
}

export const serviceProto: ServiceProto<ServiceType> = {
  services: [
    {
      id: 0,
      name: 'Router',
      type: 'api',
    },
  ],
  types: {
    'PtlRouter/ReqRouter': {
      type: 'Interface',
      properties: [
        {
          id: 0,
          name: 'inputToken',
          type: {
            type: 'String',
          },
        },
        {
          id: 1,
          name: 'outputToken',
          type: {
            type: 'String',
          },
        },
        {
          id: 2,
          name: 'maxHops',
          type: {
            type: 'Number',
          },
        },
      ],
    },
    'PtlRouter/ResRouter': {
      type: 'Interface',
      properties: [
        {
          id: 0,
          name: 'rate',
          type: {
            type: 'Number',
          },
        },
        {
          id: 1,
          name: 'bestPath',
          type: {
            type: 'Array',
            elementType: {
              type: 'String',
            },
          },
        },
        {
          id: 2,
          name: 'time',
          type: {
            type: 'Date',
          },
        },
      ],
    },
  },
}
