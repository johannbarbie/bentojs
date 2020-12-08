
export function loadContract(contractName: string) {
  const loadpath = `${process.env.PWD}/build/contracts/build/contracts/${contractName}.json`;
  return require(loadpath);
}

export function deploy(web3: any, account: any, contractJSON: any, ...args: any) {
  const contract = new web3.eth.Contract(contractJSON.abi);
  return contract.deploy({
      data: contractJSON.bytecode,
      arguments: args,
    })
    .send({
      from: account,
      gas: 6700000,
    });
}