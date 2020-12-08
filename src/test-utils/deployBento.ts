import { loadContract, deploy } from './utils';
const bentoBoxJSON = loadContract('BentoBox');
const bentoHelperJSON = loadContract('BentoHelper');
const lendingPairJSON = loadContract('LendingPair');
const wethJSON = loadContract('WETH9');
const erc20JSON = loadContract('ReturnFalseERC20');
const testOracleJSON = loadContract('TestOracle');
const EMPTY = '0x0000000000000000000000000000000000000000';

export async function deployBento(web3: any, accounts: any) {

  /* Deploy the main contracts  */
  try {
    var testOracle = await deploy(web3, accounts[0], testOracleJSON);
    var weth = await deploy(web3, accounts[0], wethJSON);
    var bentoBox = await deploy(web3, accounts[0], bentoBoxJSON, weth._address);
    var helper = await deploy(web3, accounts[0], bentoHelperJSON, bentoBox._address);
    var masterPair = await deploy(web3, accounts[0], lendingPairJSON, bentoBox._address);
  } catch (e) {
    console.log('deployment failed', e);
  }

  // deploy a pair
  const initData = await masterPair.methods.getInitData(EMPTY, EMPTY, testOracle._address, '0x00').call();
  const tx = await bentoBox.methods.deploy(masterPair._address, initData).send({ from: accounts[0], gasLimit: '0xA7D8C0' });

  return {
    accounts,
    web3,
    weth,
    bentoBox,
    helper,
    masterPair,
  }
}

export async function deployPair(
  bentoDeployment: any,
  assetOneAddress: string = '',
  assetTwoAddress: string = ''
  ) {
  const {web3, accounts, bentoBox, masterPair} = bentoDeployment;

  if (assetOneAddress.length < 40) {
    assetOneAddress = (await bentoBox.methods.WETH().call());
  }

  if (assetTwoAddress.length < 40) {
    var erc20 = await deploy(web3, accounts[0], erc20JSON, "Token", "TOK", '100000000000000000000');
    assetTwoAddress = erc20._address;
  }


  /* Deploy the main contracts  */
  try {
    var testOracle = await deploy(web3, accounts[0], testOracleJSON);
  } catch (e) {
    console.log('deployment failed', e);
  }

  // deploy a pair
  await testOracle.methods.set('1000000000000000000', accounts[0]);
  const oracleData = await testOracle.methods.getDataParameter().call();
  const initData = await masterPair.methods.getInitData(assetOneAddress, assetTwoAddress, testOracle._address, oracleData).call();
  const tx = await bentoBox.methods.deploy(masterPair._address, initData).send({ from: accounts[0], gasLimit: '0xA7D8C0' });

  const cloneAddress = tx.events['LogDeploy'].returnValues['clone_address'];
  const lendingPair = new web3.eth.Contract(lendingPairJSON.abi, cloneAddress);
  const assetOne = new web3.eth.Contract(erc20JSON.abi, assetOneAddress);
  const assetTwo = new web3.eth.Contract(erc20JSON.abi, assetTwoAddress);

  return {
    testOracle,
    lendingPair,
    assetOne,
    assetTwo,
  }
}