"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wallet_model_1 = require("./models/wallet.model");
const chain_model_1 = require("./models/chain.model");
const satoshi = new wallet_model_1.Wallet(100);
const bob = new wallet_model_1.Wallet(100);
const alice = new wallet_model_1.Wallet(100);
satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, satoshi.publicKey);
console.log(chain_model_1.Chain.instance);
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
// const blockChain = Chain.instance.chain;
//blockChain[1].curentHash = "";
console.log(chain_model_1.Chain.instance.isValidChain(chain_model_1.Chain.instance.chain));
console.log(satoshi.money);
console.log(alice.money);
console.log(bob.money);
