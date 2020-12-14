import { ethers, BigNumber } from 'ethers';
import { abi } from './abi';
const prepLogHandler = require('./utils/prepLogHandler');
const Provider = ethers.providers.Provider;


function getLendingPairContract(provider: any, address: string): ethers.Contract {
  const lendingPairContract = new ethers.Contract(address, abi.LendingPair, provider);
  return lendingPairContract;
}

const handleLogs = prepLogHandler({
  LogExchangeRate: (log: ethers.providers.Log, iface: ethers.utils.Interface, pair: LendingPair) => {
    // event LogExchangeRate(uint256 rate); 
    const decodedEvent = iface.decodeEventLog('LogExchangeRate', log.data, log.topics);
    pair.exchangeRate = decodedEvent['rate'];
  },
  LogAccrue: () => {
    //(uint256 shareAccrued, uint256 shareFee, uint256 rate, uint256 utilization);
  },
  LogAddCollateral: () => {
    //(address indexed user, uint256 share);
  },
  LogAddAsset: () => {
    //(address indexed user, uint256 share, uint256 fraction);
  },
  LogAddBorrow: () => {
    //(address indexed user, uint256 share, uint256 fraction);
  },
  LogRemoveCollateral: () => {
    //(address indexed user, uint256 share);
  },
  LogRemoveAsset: () => {
    //(address indexed user, uint256 share, uint256 fraction);
  },
  LogRemoveBorrow: () => {
    // (address indexed user, uint256 share, uint256 fraction);
  },
  LogFeeTo: () => {
    //(address indexed newFeeTo);
  },
  LogDev: () => {
    //(address indexed newFeeTo);
  }
}, new ethers.utils.Interface(abi.LendingPair));

export default class LendingPair {

  provider: ethers.providers.Provider;
  //signer: ethers.providers.JsonRpcSigner;
  public contract: ethers.Contract;
  assetAddress: string | undefined;
  collateralAddress: string | undefined;
  exchangeRate: BigNumber | undefined;
  totalCollateralShare: BigNumber = ethers.constants.Zero;
  totalBorrowShare: BigNumber = ethers.constants.Zero;
  totalAssetShare: BigNumber = ethers.constants.Zero;
  oldHeight = 0;

  constructor(provider: any, lendingPairAddress: string, deploymentHeight: number = 0) {
    let ethersProvider: ethers.providers.Provider;
    if (Provider.isProvider(provider)) {
      //detect ethersProvider
      ethersProvider = provider;
    } else {
      ethersProvider = new ethers.providers.Web3Provider(provider);
    }

    this.provider = ethersProvider;
    this.contract = getLendingPairContract(
      ethersProvider,
      lendingPairAddress
    );

    this.oldHeight = deploymentHeight;
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
        address: this.contract.address
      })));
    }
    // apply the events to class state
    await handleLogs(logs, this);
  }

  // returns the price of given units of asset in units of collateral, or
  // returns the price of given units of collateral in units of asset.
  async getPrice(token: string | undefined, amount: BigNumber = ethers.constants.WeiPerEther): Promise<BigNumber> {
    return amount.mul(this.exchangeRate!).div(ethers.constants.WeiPerEther);
  }

}
