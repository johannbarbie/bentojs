"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const abi_1 = require("./abi");
const prepLogHandler = require('./utils/prepLogHandler');
const Provider = ethers_1.ethers.providers.Provider;
function getLendingPairContract(provider, address) {
    const lendingPairContract = new ethers_1.ethers.Contract(address, abi_1.abi.LendingPair, provider);
    return lendingPairContract;
}
const handleLogs = prepLogHandler({
    LogExchangeRate: (log, iface, pair) => {
        const decodedEvent = iface.decodeEventLog('LogExchangeRate', log.data, log.topics);
        pair.exchangeRate = decodedEvent['rate'];
    },
    LogAccrue: () => {
    },
    LogAddCollateral: () => {
    },
    LogAddAsset: () => {
    },
    LogAddBorrow: () => {
    },
    LogRemoveCollateral: () => {
    },
    LogRemoveAsset: () => {
    },
    LogRemoveBorrow: () => {
    },
    LogFeeTo: () => {
    },
    LogDev: () => {
    }
}, new ethers_1.ethers.utils.Interface(abi_1.abi.LendingPair));
class LendingPair {
    constructor(provider, lendingPairAddress, deploymentHeight = 0) {
        this.totalCollateralShare = ethers_1.ethers.constants.Zero;
        this.totalBorrowShare = ethers_1.ethers.constants.Zero;
        this.totalAssetShare = ethers_1.ethers.constants.Zero;
        this.oldHeight = 0;
        let ethersProvider;
        if (Provider.isProvider(provider)) {
            ethersProvider = provider;
        }
        else {
            ethersProvider = new ethers_1.ethers.providers.Web3Provider(provider);
        }
        this.provider = ethersProvider;
        this.contract = getLendingPairContract(ethersProvider, lendingPairAddress);
        this.oldHeight = deploymentHeight;
    }
    scanEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            const newHeight = (yield this.provider.getBlockNumber());
            const stepSize = 2;
            let steps = ((newHeight - this.oldHeight) / stepSize) >> 0;
            if ((newHeight - this.oldHeight) % stepSize > 0) {
                steps++;
            }
            let logs = [];
            for (let i = this.oldHeight; i < this.oldHeight + (steps * stepSize); i += stepSize) {
                logs = logs.concat((yield this.provider.getLogs({
                    fromBlock: i,
                    toBlock: (i + stepSize > newHeight) ? newHeight : i + stepSize,
                    address: this.contract.address
                })));
            }
            yield handleLogs(logs, this);
        });
    }
    getPrice(token, amount = ethers_1.ethers.constants.WeiPerEther) {
        return __awaiter(this, void 0, void 0, function* () {
            return amount.mul(this.exchangeRate).div(ethers_1.ethers.constants.WeiPerEther);
        });
    }
}
exports.default = LendingPair;
