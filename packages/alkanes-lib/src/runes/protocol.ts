import { ProtocolData } from './alkane'

export class Protocol {
  protocolTag: bigint
  protocolData: ProtocolData

  constructor(protocolTag: bigint, protocolData: ProtocolData) {
    this.protocolTag = protocolTag
    this.protocolData = protocolData
  }
}
