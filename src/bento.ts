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
    const bentoface = new ethers.utils.Interface(abi.BentoBox);
    const pairface = new ethers.utils.Interface(abi.LendingPair);
    const initDataFrament = pairface.fragments.find(frag => frag.name == 'getInitData') ?? {inputs:[]};
    for (let i = this.lastScanned; i < this.lastScanned + (steps * stepSize); i += stepSize) {
      // get all the events on the contract
      const logs = await this.provider.getLogs({
        fromBlock: i,
        toBlock: (i+stepSize > to) ? to: i + stepSize,
        address: this.bentoBox.address
      });
      logs.forEach((log: any) => {
        // todo: have handlers for each event
        const decodedEvent = bentoface.decodeEventLog('LogDeploy', log.data, log.topics);
        let cloneAddress = decodedEvent['clone_address'];
        this.masterContracts.set(cloneAddress.replace('0x', '').toLowerCase(), decodedEvent['masterContract']);

        // TODO: better find a way to get the token addresses independent of lending implementation        
        const decodeData = ethers.utils.defaultAbiCoder.decode(initDataFrament.inputs, decodedEvent.data);
        const collateralAddr = decodeData['collateral_'].replace('0x', '').toLowerCase();
        const assetAddr = decodeData['asset_'].replace('0x', '').toLowerCase();
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