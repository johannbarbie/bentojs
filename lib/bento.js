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
const prepLogHandler = require('./utils/prepLogHandler');
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
const handleLogs = prepLogHandler({
    LogDeploy: (log, iface, bento) => {
        var _a;
        const decodedEvent = iface.decodeEventLog('LogDeploy', log.data, log.topics);
        let cloneAddress = decodedEvent['clone_address'];
        bento.masterContracts.set(cloneAddress.replace('0x', '').toLowerCase(), decodedEvent['masterContract']);
        const pairface = new ethers_1.ethers.utils.Interface(abi_1.abi.LendingPair);
        const initDataFrament = (_a = pairface.fragments.find(frag => frag.name == 'getInitData')) !== null && _a !== void 0 ? _a : { inputs: [] };
        const decodeData = ethers_1.ethers.utils.defaultAbiCoder.decode(initDataFrament.inputs, decodedEvent.data);
        const collateralAddr = decodeData['collateral_'].replace('0x', '').toLowerCase();
        const assetAddr = decodeData['asset_'].replace('0x', '').toLowerCase();
        const key = collateralAddr < assetAddr ? collateralAddr + assetAddr : assetAddr + collateralAddr;
        bento.lendingPairs.set(key, cloneAddress);
    }
}, new ethers_1.ethers.utils.Interface(abi_1.abi.BentoBox));
class Bento {
    constructor(provider, bentoBoxAddressOrNetworkId) {
        this.oldHeight = 0;
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
            this.oldHeight = deployment.height;
        }
        this.lendingPairs = new Map();
        this.masterContracts = new Map();
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
                    address: this.bentoBox.address
                })));
            }
            yield handleLogs(logs, this);
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
