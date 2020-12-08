import { ethers } from 'ethers';
import { abi } from './abi';
const prepLogHandler = require('./utils/prepLogHandler');
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

const handleLogs = prepLogHandler({
  LogDeploy: (log: ethers.providers.Log, iface: ethers.utils.Interface, bento: Bento) => {
    const decodedEvent = iface.decodeEventLog('LogDeploy', log.data, log.topics);
    let cloneAddress = decodedEvent['clone_address'];
    bento.masterContracts.set(cloneAddress.replace('0x', '').toLowerCase(), decodedEvent['masterContract']);

    // TODO: better find a way to get the token addresses independent of lending implementation        
    const pairface = new ethers.utils.Interface(abi.LendingPair);
    const initDataFrament = pairface.fragments.find(frag => frag.name == 'getInitData') ?? {inputs:[]};
    const decodeData = ethers.utils.defaultAbiCoder.decode(initDataFrament.inputs, decodedEvent.data);
    const collateralAddr = decodeData['collateral_'].replace('0x', '').toLowerCase();
    const assetAddr = decodeData['asset_'].replace('0x', '').toLowerCase();
    const key = collateralAddr < assetAddr ? collateralAddr + assetAddr: assetAddr + collateralAddr;
    bento.lendingPairs.set(key, cloneAddress);
  }
}, new ethers.utils.Interface(abi.BentoBox));

export default class Bento {

  provider: ethers.providers.Provider;
  //signer: ethers.providers.JsonRpcSigner;
  bentoBox: any;
  lendingPairs: Map<string, string>;
  masterContracts: Map<string, string>;
  oldHeight = 0;

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
      this.oldHeight = deployment.height;
    }
    this.lendingPairs = new Map<string, string>();
    this.masterContracts = new Map<string, string>();
  }

  async scanEvents() {
    const newHeight = (await this.provider.getBlockNumber());
    const stepSize = 2;
    let steps = ((newHeight - this.oldHeight) / stepSize) >> 0;
    if ((newHeight - this.oldHeight) % stepSize > 0) {
      steps++;
    }
    let logs: any = [];
    for (let i = this.oldHeight; i < this.oldHeight + (steps * stepSize); i += stepSize) {
      // get all the events on the contract
      logs = logs.concat((await this.provider.getLogs({
        fromBlock: i,
        toBlock: (i+stepSize > newHeight) ? newHeight: i + stepSize,
        address: this.bentoBox.address
      })));
    }
    // apply the events to class state
    await handleLogs(logs, this);
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