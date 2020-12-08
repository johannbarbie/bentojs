import { ethers } from 'ethers';
declare const bentoBoxDeployments: any;
export default class Bento {
    provider: ethers.providers.Provider;
    bentoBox: any;
    lendingPairs: Map<string, string>;
    masterContracts: Map<string, string>;
    oldHeight: number;
    constructor(provider: any, bentoBoxAddressOrNetworkId: string | number);
    scanEvents(): Promise<void>;
    getPair(assetA: string, assetB: string): string | undefined;
    getMaster(lendingAddress: string): string | undefined;
    getTotalShare(assetAddress: string): Promise<any>;
}
export { bentoBoxDeployments, };
