"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wallet_model_1 = require("./models/wallet.model");
const chain_model_1 = require("./models/chain.model");
const block_model_1 = require("./models/block.model");
const satoshi = new wallet_model_1.Wallet(100);
const bob = new wallet_model_1.Wallet(100);
const alice = new wallet_model_1.Wallet(100);
satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, satoshi.publicKey);
chain_model_1.Chain.instance.chain.forEach(element => {
    switch (element.transaction.payee) {
        case satoshi.publicKey:
            satoshi.money += element.transaction.amount;
            break;
        case alice.publicKey:
            alice.money += element.transaction.amount;
            break;
        case bob.publicKey:
            bob.money += element.transaction.amount;
            break;
    }
    //
    switch (element.transaction.payer) {
        case satoshi.publicKey:
            satoshi.money -= element.transaction.amount;
            break;
        case alice.publicKey:
            alice.money -= element.transaction.amount;
            break;
        case bob.publicKey:
            bob.money -= element.transaction.amount;
            break;
    }
});
const blockChain = new chain_model_1.Chain();
for (var i = 1; i < chain_model_1.Chain.instance.chain.length; i++) {
    let block = chain_model_1.Chain.instance.chain[i];
    blockChain.chain.push(new block_model_1.Block(block.index, block.prevHash, block.timestamp, block.transaction, block.curentHash, block.difficulty, block.nonce));
}
blockChain.chain[1].curentHash = "";
console.log(chain_model_1.Chain.instance);
console.log(chain_model_1.Chain.instance.isValidChain(blockChain.chain));
console.log(satoshi.money);
console.log(alice.money);
console.log(bob.money);
