import { DeployFunctionOptions, createDeployFunction } from '@utils/deploy'
import { precision } from '@utils/precision'

export const options: DeployFunctionOptions = {
  contractName: 'Ink',
  dependencyNames: [],
  getDeployArgs({ namedAccounts }) {
    return [namedAccounts.deployer]
  },
}

export default createDeployFunction(options)
