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
exports.bentoBoxDeployments = void 0;
const ethers_1 = require("ethers");
const abi_1 = require("./abi");
const Provider = ethers_1.ethers.providers.Provider;
const addressRegex = RegExp('^0x[a-fA-F0-9]{40}$');
const bentoBoxDeployments = {
    '3': {
        address: '0x066b83CE269aa9851704d30Ce7e838a8B772b340',
        height: 123
    }
};
exports.bentoBoxDeployments = bentoBoxDeployments;
function getBentoBoxContract(provider, address) {
    const bentoBox = new ethers_1.ethers.Contract(address.toLowerCase(), abi_1.abi.BentoBox, provider);
    return bentoBox;
}
class Bento {
    constructor(provider, bentoBoxAddressOrNetworkId) {
        this.lastScanned = 0;
        let ethersProvider;
        if (Provider.isProvider(provider)) {
            ethersProvider = provider;
        }
        else {
            ethersProvider = new ethers_1.ethers.providers.Web3Provider(provider);
        }
        this.provider = ethersProvider;
        if (addressRegex.test(bentoBoxAddressOrNetworkId)) {
            this.bentoBox = getBentoBoxContract(ethersProvider, bentoBoxAddressOrNetworkId);
        }
        else {
            const deployment = bentoBoxDeployments[`${bentoBoxAddressOrNetworkId}`];
            this.bentoBox = getBentoBoxContract(ethersProvider, deployment.address);
            this.lastScanned = deployment.height;
        }
        this.lendingPairs = new Map();
        this.masterContracts = new Map();
    }
    scanEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            const to = (yield this.provider.getBlockNumber());
            const stepSize = 2;
            let steps = ((to - this.lastScanned) / stepSize) >> 0;
            if ((to - this.lastScanned) % stepSize > 0) {
                steps++;
            }
            const filter = this.bentoBox.filters.LogDeploy(null, null);
            for (let i = this.lastScanned; i < this.lastScanned + (steps * stepSize); i += stepSize) {
                const logs = yield this.bentoBox.queryFilter(filter, i, (i + stepSize > to) ? to : i + stepSize);
                logs.forEach((log) => {
                    let cloneAddress = log.args['clone_address'];
                    this.masterContracts.set(cloneAddress.replace('0x', '').toLowerCase(), log.args['masterContract']);
                    const collateralAddr = log.args.data.substring(26, 66);
                    const assetAddr = log.args.data.substring(90, 130);
                    const key = collateralAddr < assetAddr ? collateralAddr + assetAddr : assetAddr + collateralAddr;
                    this.lendingPairs.set(key, cloneAddress);
                });
            }
        });
    }
    getPair(assetA, assetB) {
        assetA = assetA.replace('0x', '').toLowerCase();
        assetB = assetB.replace('0x', '').toLowerCase();
        const key = assetA < assetB ? assetA + assetB : assetB + assetA;
        return this.lendingPairs.get(key);
    }
    getMaster(lendingAddress) {
        lendingAddress = lendingAddress.replace('0x', '').toLowerCase();
        return this.masterContracts.get(lendingAddress);
    }
    getTotalShare(assetAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.bentoBox.totalShare(assetAddress);
        });
    }
}
exports.default = Bento;
