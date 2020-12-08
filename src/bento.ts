import { ethers } from 'ethers';
import {abi} from './abi';
const Provider = ethers.providers.Provider;

const addressRegex = RegExp('^0x[a-fA-F0-9]{40}$');

const bentoBoxDeployments: any = {
  // Mainnet
  //'1': '0x066b83CE269aa9851704d30Ce7e838a8B772b340',
  // Ropsten
  '3': {
    address: '0x066b83CE269aa9851704d30Ce7e838a8B772b340',
    height: 123
  }
  // Rinkeby
  //'4': '0x066b83CE269aa9851704d30Ce7e838a8B772b340',
  // Goerli
  //'5': '0x066b83CE269aa9851704d30Ce7e838a8B772b340',
};

function getBentoBoxContract(provider: any, address: string) {
  const bentoBox = new ethers.Contract(address.toLowerCase(), abi.BentoBox, provider);
  return bentoBox;
}

export default class Bento {

	provider: ethers.providers.Provider;
	//signer: ethers.providers.JsonRpcSigner;
	bentoBox: any;
  lendingPairs: Map<string, string>;
  masterContracts: Map<string, string>;
  lastScanned = 0;

  constructor(provider: any, bentoBoxAddressOrNetworkId: string | number) {
    let ethersProvider: ethers.providers.Provider;
    if (Provider.isProvider(provider)) {
      //detect ethersProvider
      ethersProvider = provider;
    } else {
      ethersProvider = new ethers.providers.Web3Provider(provider);
    }

    this.provider = ethersProvider;
    if (addressRegex.test(bentoBoxAddressOrNetworkId as string)) {
      this.bentoBox = getBentoBoxContract(
        ethersProvider,
        bentoBoxAddressOrNetworkId as string
      );      
    } else {
      const deployment = bentoBoxDeployments[`${bentoBoxAddressOrNetworkId}`];
      this.bentoBox = getBentoBoxContract(
        ethersProvider,
        deployment.address
      );
      this.lastScanned = deployment.height;
    }
    this.lendingPairs = new Map<string, string>();
    this.masterContracts = new Map<string, string>();
  }

  async scanEvents() {
    const to = (await this.provider.getBlockNumber());
    const stepSize = 2;
    let steps = ((to - this.lastScanned) / stepSize) >> 0;
    if ((to - this.lastScanned) % stepSize > 0) {
      steps++;
    }
    const filter = this.bentoBox.filters.LogDeploy(null, null);
    for (let i = this.lastScanned; i < this.lastScanned + (steps * stepSize); i += stepSize) {
      const logs = await this.bentoBox.queryFilter(filter, i, (i+stepSize > to) ? to: i + stepSize);
      logs.forEach((log: any) => {
        let cloneAddress = log.args['clone_address'];
        this.masterContracts.set(cloneAddress.replace('0x', '').toLowerCase(), log.args['masterContract']);
        // we don't know the ABI for sure, hence no fancy parsing
        // need to find a way to get the token addresses independent of lending implementation
        const collateralAddr = log.args.data.substring(26, 66);
        const assetAddr = log.args.data.substring(90, 130);
        const key = collateralAddr < assetAddr ? collateralAddr + assetAddr: assetAddr + collateralAddr;
        this.lendingPairs.set(key, cloneAddress);
      });
    }
  }

  getPair(assetA: string, assetB: string) {
    // sort pairs
    assetA = assetA.replace('0x', '').toLowerCase();
    assetB = assetB.replace('0x', '').toLowerCase();
    const key = assetA < assetB ? assetA + assetB: assetB + assetA;
    // look into map
    return this.lendingPairs.get(key);
  }

  getMaster(lendingAddress: string) {
    lendingAddress = lendingAddress.replace('0x', '').toLowerCase();
    return this.masterContracts.get(lendingAddress);
  }

  async getTotalShare(assetAddress: string) {
    return await this.bentoBox.totalShare(assetAddress);
  }
}

export {
  bentoBoxDeployments,
}