require('dotenv').config();
const firebase = require("firebase");
const ContributionABI = require('../build/contracts/PolyMathTokenOffering.json').abi;
const POLY_ABI = require('../build/contracts/PolyMathToken.json').abi;

// const Web3 = require('web3');
// const MAINET_RPC_URL = 'https://mainnet.infura.io/metamask'
// const KOVAN_RPC_URL = 'https://kovan.infura.io/metamask'
// const provider = new Web3.providers.HttpProvider(KOVAN_RPC_URL);
// const web3 = new Web3(provider);


var config = {
    apiKey: process.env.FIREBASE_APIKEY,
    authDomain: process.env.FIREBASE_AUTHDOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
};
firebase.initializeApp(config);
let database = firebase.database();

let CONTRIBUTION_ADDRESS;
let POLY_ADDRESS;
let myContract;
let cnd;
let web3;
function setup({web3Param, contribAddress, polyAddr}){
    web3 = web3Param;
    CONTRIBUTION_ADDRESS = contribAddress
    POLY_ADDRESS = polyAddr
    myContract = new web3.eth.Contract(ContributionABI, CONTRIBUTION_ADDRESS);
    cnd = new web3.eth.Contract(POLY_ABI, POLY_ADDRESS);
}

// Get a reference to the database service

function isWhitelisted(toCheckAddress) {
    database.ref(`notWhitelisted/`).remove();
    var count = 0;
    var leftRun = toCheckAddress.length;
    let notWhitelisted = [];
    let promise = new Promise((res) => {
        if(toCheckAddress.length === 0 || !toCheckAddress) {
            rej('array is empty');
        }
        toCheckAddress.forEach((address, index) => {
            myContract.methods.whitelist(address).call().then((isWhitelisted) => {
                leftRun--;
                if (!isWhitelisted) {
                    database.ref(`notWhitelisted/${count}`).set(address);
                    count++;
                    notWhitelisted.push(address);
                }
                if (leftRun === 0) {
                    console.log('FINISHED! notWhitelisted: ', notWhitelisted.length);
                    res(notWhitelisted);
                }
            });
        })
    })
    return promise;
}

function checkBalances(toCheckAddress) {
    database.ref('hasBalance/').remove();
    var leftRun = toCheckAddress.length;
    let addresses = [];
    var count = 0;
    let promise = new Promise((res, rej) => {
        if(toCheckAddress.length === 0 || !toCheckAddress) {
            rej({msg: 'array is empty checkBalances', length: toCheckAddress.length, bool: !!toCheckAddress});
        }
        toCheckAddress.forEach((address) => {
            cnd.methods.balanceOf(address).call().then((balance) => {
                leftRun--;
                if (balance > 0) {
                    database.ref('hasBalance/' + count).set(address);
                    count++;
                } else {
                    addresses.push(address)
                }
               if (leftRun === 0) {
                    console.log('FINISHED! checkBalance. addresses with 0 balance: ', addresses.length);
                    res(addresses);
                }
            })
        })
    })
    return promise;
}
function filterAddresses(arrayOfAddresses) {
    const date = Date.now();
    console.log(date, 'DATE NOW');
    database.ref('toWhitelist/' + date).set(null);
    return new Promise((res, rej) => {
        return checkBalances(arrayOfAddresses).then((filteredarr) => {
            return isWhitelisted(filteredarr);
        }).then((whitelistedAddress) => {
            database.ref('toWhitelist/' + date).set(whitelistedAddress);
            res(whitelistedAddress);
        }).catch(console.error);
    })
}
exports.filterAddresses = filterAddresses;
exports.checkBalances = checkBalances;
exports.isWhitelisted = isWhitelisted;
exports.setup = setup;