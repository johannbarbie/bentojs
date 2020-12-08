import { ethers } from 'ethers';

module.exports = (handlers: any, iface: any) => {
  Object.keys(iface.events).forEach(key => {
    const handlerFunction = handlers[key.split('(')[0]];
    // remap from Event names to topics
    if (handlerFunction) {
      // hash
      const topicHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(key));
      // attach new attribute
      handlers[topicHash] = handlerFunction;
    }
  });

  return async (logs: any, bento: any) => {
    for (const log of logs) {
      if (handlers[log.topics[0]]) {
        const result = handlers[log.topics[0]](log, iface, bento);
        if (result && typeof result.then === 'function') {
          await result; // eslint-disable-line no-await-in-loop
        }
      } else {
        console.warn('Unknown event. ABI can be outdated');
      }
    }
  };
};