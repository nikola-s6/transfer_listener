"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var alchemy_sdk_1 = require("alchemy-sdk");
var ethers_1 = require("ethers");
var dotenv = require("dotenv");
dotenv.config();
var alchemy = new alchemy_sdk_1.Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: alchemy_sdk_1.Network.ETH_SEPOLIA,
});
var transferHash = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
var coder = new ethers_1.ethers.AbiCoder();
var walletAddress = "0x11048698268aBF043F7A4617E8E72A55e74281CA";
var counter = 0;
alchemy.ws.on({
    method: alchemy_sdk_1.AlchemySubscription.MINED_TRANSACTIONS,
    addresses: [
        {
            from: walletAddress,
        },
    ],
}, function (tx) {
    alchemy.core
        .getTransactionReceipt(tx.transaction.hash)
        .then(function (txReceipt) {
        var transfers = txReceipt.logs.filter(function (t) { return t.topics[0] === transferHash; });
        if (transfers.length < 2)
            return;
        if (!(transfers[0].topics[1] !== walletAddress &&
            transfers[transfers.length - 1].topics[2] !== walletAddress)) {
            return;
        }
        var swapData = {
            trader: txReceipt.from,
            txHash: txReceipt.transactionHash,
            tokenOut: transfers[0].address,
            tokenIn: transfers[transfers.length - 1].address,
            tokenOutAmount: coder.decode(["uint256"], transfers[0].data).toString(),
            tokenInAmount: coder.decode(["uint256"], transfers[transfers.length - 1].data).toString(),
        };
        console.log(swapData);
        console.log(counter++);
    })
        .catch(function (error) {
        console.log(error.message);
    });
});
