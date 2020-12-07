// src/index.ts

import { ethers } from 'ethers';
const Provider = ethers.providers.Provider;
import {abi} from './abi';

interface AddressMapping {
    '3': string,
}

interface BentoOptions {
    networkId: number;
    provider: any; 
    bentoAddress: string;
}

interface ContractOptions {
    address: string;
    provider: ethers.providers.Provider; 
}

const bentoAddresses: AddressMapping = {
  // Mainnet
  //'1': '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  // Ropsten
  '3': '0x066b83CE269aa9851704d30Ce7e838a8B772b340',
  // Rinkeby
  //'4': '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  // Goerli
  //'5': '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
};

function getBentoAddress(networkId: number) {
	const address = bentoAddresses[`${networkId}` as keyof AddressMapping];
  if (address) {
  	throw new Error(`network ${networkId} not supported`);
  }
  return address;
}

function getBentoBoxContract(options: ContractOptions) {
  return new ethers.Contract(options.address, abi.IBentoBox, options.provider);
}

export default class Bento {

	provider: ethers.providers.Provider;
	//signer: ethers.providers.JsonRpcSigner;
	bb: any;

  constructor(options: BentoOptions) {
    const { networkId, provider, bentoAddress } = options;
    let ethersProvider: ethers.providers.Provider;
    if (Provider.isProvider(provider)) {
      //detect ethersProvider
      ethersProvider = provider;
    } else {
      ethersProvider = new ethers.providers.Web3Provider(provider);
    }
    this.provider = ethersProvider;
    //this.signer = ethersProvider.getSigner();
    this.bb = getBentoBoxContract({
      address: bentoAddress ? bentoAddress : getBentoAddress(networkId),
      provider: ethersProvider,
    })
  }

  async getTotalShare(assetAddress: string) {
    return await this.bb.totalShare(assetAddress);
  }
}


export {
  getBentoAddress,
  abi
}