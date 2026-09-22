// Provider controller for handling RPC requests
import { ErrorCodes, WalletError } from '@unisat/wallet-shared'
import { keyringService } from '../../services'
import internalMethod from './internalMethod'
import { ProviderMethodArgs, ProviderMethods } from './methodList'
import rpcFlow from './rpcFlow'

class ProviderController {
  async handleRequest(req: {
    session: {
      origin: string
      icon: string
      name: string
    }
    data: ProviderMethodArgs<ProviderMethods>
  }) {
    const {
      data: { method },
    } = req

    if (!method) {
      throw new WalletError(ErrorCodes.METHOD_NOT_FOUND, 'Missing method in request')
    }

    if (internalMethod[method]) {
      return internalMethod[method](req)
    }

    const hasVault = keyringService.hasVault()
    if (!hasVault) {
      throw new WalletError(ErrorCodes.NO_ACCOUNT, 'wallet must has at least one account')
    }
    return rpcFlow(req)
  }
}

export default new ProviderController()
