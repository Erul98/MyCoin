import { Wallet } from "./models/wallet.model";
import { Chain } from "./models/chain.model";
import { Block } from "./models/block.model";

const satoshi = new Wallet(100);
const bob = new Wallet(100);
const alice = new Wallet(100);

satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, satoshi.publicKey);

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

const blockChain = new Chain();
for (var i = 1; i < Chain.instance.chain.length; i++) {
    let block = Chain.instance.chain[i];
    blockChain.chain.push(new Block(block.index, block.prevHash, block.timestamp, block.transaction, block.curentHash, block.difficulty, block.nonce));
}
blockChain.chain[1].curentHash = "";
console.log(Chain.instance);
console.log(Chain.instance.isValidChain(blockChain.chain));
console.log(satoshi.money);
console.log(alice.money);
console.log(bob.money);