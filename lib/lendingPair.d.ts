import { ethers, BigNumber } from 'ethers';
export default class LendingPair {
    provider: ethers.providers.Provider;
    contract: ethers.Contract;
    assetAddress: string | undefined;
    collateralAddress: string | undefined;
    exchangeRate: BigNumber | undefined;
    totalCollateralShare: BigNumber;
    totalBorrowShare: BigNumber;
    totalAssetShare: BigNumber;
    oldHeight: number;
    constructor(provider: any, lendingPairAddress: string, deploymentHeight?: number);
    scanEvents(): Promise<void>;
    getPrice(token: string | undefined, amount?: BigNumber): Promise<BigNumber>;
}
