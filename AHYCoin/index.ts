import { Wallet } from "./models/wallet.model";
import { Chain } from "./models/chain.model";

const satoshi = new Wallet(100);
const bob = new Wallet(100);
const alice = new Wallet(100);

satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, satoshi.publicKey);


console.log(Chain.instance);

Chain.instance.chain.forEach(element => {
    switch (element.transaction.payee) {
        case satoshi.publicKey:
            satoshi.money += element.transaction.amount;
            break
        case alice.publicKey:
            alice.money += element.transaction.amount;
            break
        case bob.publicKey:
            bob.money += element.transaction.amount;
            break
    }
    //
    switch (element.transaction.payer) {
        case satoshi.publicKey:
            satoshi.money -= element.transaction.amount;
            break
        case alice.publicKey:
            alice.money -= element.transaction.amount;
            break
        case bob.publicKey:
            bob.money -= element.transaction.amount;
            break

    }
});

console.log(satoshi.money);
console.log(alice.money);
console.log(bob.money);