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

describe('bento.js tests', () => {
  beforeAll(async () => {
    provider = ganache.provider({ gasLimit: 12000000, networkId: 1337 });
    web3 = new Web3(provider);
    accounts = await web3.eth.getAccounts();

    bentoDeployment = await deployBento(web3, accounts);

    bentoLib = new Bento(provider, bentoDeployment.bentoBox._address);

    pairDeployment = await deployPair(bentoDeployment);
  });


  describe('Lending Pair Index', () => {
    it('read initial deployment', async () => {
      await bentoLib.scanEvents();
      const weth = bentoDeployment.weth._address;
      const erc20 = pairDeployment.assetTwo._address;
      const lendingPair = pairDeployment.lendingPair._address;
      expect(bentoLib.getPair(weth, erc20)).toBe(lendingPair);
    });

    it('deploy one more, and check again', async () => {
      const masterAddr = bentoLib.getMaster(pairDeployment.lendingPair._address);
      expect(masterAddr).toBe(bentoDeployment.masterPair._address);
      
      const deployment = await deployPair(bentoDeployment);

      await bentoLib.scanEvents();
      const weth = bentoDeployment.weth._address;
      const erc20 = deployment.assetTwo._address;
      const lendingPair = deployment.lendingPair._address;
      expect(bentoLib.getPair(weth, erc20)).toBe(lendingPair);
    });
  });
})