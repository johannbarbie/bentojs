/**
 * @jest-environment node
 */
import 'jest';
import ganache from 'ganache-core';
import {deployBento, deployPair } from './test-utils/deployBento';
import Bento from '.';
import { ethers } from 'ethers';
const Web3 = require('web3');
declare var window: any;

let provider: any;
let web3: any;
let accounts: any;
let bentoLib: any;
let bentoDeployment: any;
let pairDeployment: any;

describe('lendingPair tests', () => {
  beforeAll(async () => {
    provider = ganache.provider({ gasLimit: 12000000, networkId: 1337 });
    web3 = new Web3(provider);
    accounts = await web3.eth.getAccounts();

    bentoDeployment = await deployBento(web3, accounts);

    bentoLib = new Bento(provider, bentoDeployment.bentoBox._address);

    pairDeployment = await deployPair(bentoDeployment);
  });


  describe('Lending Pair Index', () => {
    it('read updated exchange rate', async () => {
      // sync bento and read pair
      await bentoLib.scanEvents();
      const weth = bentoDeployment.weth._address;
      const erc20 = pairDeployment.assetTwo._address;
      const lendingPairAddr = pairDeployment.lendingPair._address;
      const lendingPair = bentoLib.getPair(weth, erc20);
      expect(lendingPair.contract.address).toBe(lendingPairAddr);

      // check price
      await pairDeployment.testOracle.methods.set(ethers.constants.WeiPerEther.toString(), weth).send({from: accounts[0]});
      const signer = lendingPair.contract.provider.getSigner(accounts[0]);
      await lendingPair.contract.connect(signer).updateExchangeRate();
      await lendingPair.scanEvents();
      let wethPriceInErc20 = await lendingPair.getPrice(weth, ethers.constants.WeiPerEther);
      expect(wethPriceInErc20.toString()).toBe(ethers.constants.WeiPerEther.toString());

      // update price and sync pair
      const half = ethers.constants.WeiPerEther.div('2');
      await pairDeployment.testOracle.methods.set(half.toString(), weth).send({from: accounts[0]});
      await lendingPair.contract.connect(signer).updateExchangeRate();
      await lendingPair.scanEvents();
      wethPriceInErc20 = await lendingPair.getPrice(weth, ethers.constants.WeiPerEther);
      expect(wethPriceInErc20.toString()).toBe(half.toString());
    });
  });
})