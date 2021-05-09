import * as crypto from 'crypto';
import { Transaction } from "./transaction.model";
import { Chain } from "./chain.model";

class Wallet {

    // MARK:- Init
    constructor(
        public amount: number,
        public privateKey: string,
        public publicKey: string,
    ) {}

    // MARK: - Functions
    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}

export { Wallet };