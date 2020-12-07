const fs = require('fs');
const util = require('util');

async function getContractsFromConfig(config) {
  const data = fs.readFileSync(config, 'UTF-8');
  const lines = data.split("\n");
  let contracts = lines.find(line => line.split('=')[0] === 'contracts');
  contracts = contracts.split(',');
  contracts[0] = contracts[0].split('=')[1];
  return contracts;
}

async function getAbisFromContracts(contracts) {
  const abis = {};
  contracts.forEach(contractName => {
    contract = JSON.parse(fs.readFileSync(`./build/contracts/build/contracts/${contractName}.json`, 'UTF-8'));
    abis[contractName] = JSON.stringify(contract.abi);
  });
  return abis;
}

async function writeAbis(abis, abiFilePath) {
  fs.writeFileSync(abiFilePath, `export const abi = ${util.inspect(abis)};`, 'utf-8');
}


(async function() {
  const abiFilePath = './src/abi.ts';
  fs.unlinkSync(abiFilePath);
  let contracts = await getContractsFromConfig('abi.config');
  let abis = await getAbisFromContracts(contracts);
  await writeAbis(abis, abiFilePath);
})();