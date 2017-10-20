require('dotenv').config();
const ICO_ABI = require('../build/contracts/PolyMathTokenOffering.json').abi;
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider('http://localhost:8549');
const web3 = new Web3(provider);

const ARRAY_OF_ADDRESSES = require('./ARRAY_OF_ADDRESSES.json');

const CONTRIBUTION_ADDRESS = process.env.CONTRIBUTION_ADDRESS;
const POLY_TOKEN = process.env.POLY_TOKEN;
const UNLOCKED_ADDRESS = process.env.UNLOCKED_ADDRESS;

const { checkBalances, filterAddresses, setup } = require('./filterAddresses');
setup({ web3Param: web3, contribAddress: CONTRIBUTION_ADDRESS, polyAddr: POLY_TOKEN });
filterAddresses(ARRAY_OF_ADDRESSES).then((toWhitelist) => {
    console.log(toWhitelist.length);
    const status = true;
    const addPerTx = 130;
    const slices = Math.ceil(toWhitelist.length / addPerTx);
    return sendTransactionToContribution({array: toWhitelist, slice: slices, addPerTx, status});
}).then(console.log).catch(console.error);

const GAS_PRICE = web3.utils.toWei(10, 'gwei');
const GAS_LIMIT = '6700000';
const myContract = new web3.eth.Contract(ICO_ABI, CONTRIBUTION_ADDRESS, {
    from: UNLOCKED_ADDRESS, // default from address
    gasPrice: GAS_PRICE,
    gas: GAS_LIMIT // default gas price in wei
});


function sendTransactionToContribution({array, slice, addPerTx, status}) {
    const start = (slice - 1) * addPerTx;
    const end = slice * addPerTx;
    const arrayToProcess = array.slice(start, end);
    let abi = myContract.methods.whitelistAddresses(arrayToProcess, status).encodeABI();
    console.log('Processing array length', arrayToProcess.length, arrayToProcess[0], arrayToProcess[arrayToProcess.length - 1], status);
    return new Promise((res) => {
        web3.eth.estimateGas({
            from: UNLOCKED_ADDRESS, to: CONTRIBUTION_ADDRESS, data: abi, gas: GAS_LIMIT, gasPrice: GAS_PRICE
        }).then((gasNeeded) => {
            console.log('gasNeeded', gasNeeded);
            web3.eth.sendTransaction({
                from: UNLOCKED_ADDRESS, to: CONTRIBUTION_ADDRESS, data: abi, gas: gasNeeded, gasPrice: GAS_PRICE
            })
            slice--;
            if (slice > 0) {
                sendTransactionToContribution({array, slice, addPerTx, status});
            } else {
                res({ result: 'completed' });
                // process.exit();
            }

        });
    })
}