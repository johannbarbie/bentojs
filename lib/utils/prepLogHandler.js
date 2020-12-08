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
module.exports = (handlers, iface) => {
    Object.keys(iface.events).forEach(key => {
        const handlerFunction = handlers[key.split('(')[0]];
        if (handlerFunction) {
            const topicHash = ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes(key));
            handlers[topicHash] = handlerFunction;
        }
    });
    return (logs, bento) => __awaiter(void 0, void 0, void 0, function* () {
        for (const log of logs) {
            if (handlers[log.topics[0]]) {
                const result = handlers[log.topics[0]](log, iface, bento);
                if (result && typeof result.then === 'function') {
                    yield result;
                }
            }
            else {
                console.warn('Unknown event. ABI can be outdated');
            }
        }
    });
};
