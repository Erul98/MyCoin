import * as crypto from 'crypto';
import { Transaction } from "./transaction.model";
import { Chain } from "./chain.model";
import ec from "../constants/keygenerator"

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
        const signingKey = ec.keyFromPrivate(this.privateKey, 'hex');
        const signature = signingKey.sign(this.hashSHA256(transaction.toString()), 'base64');
        // Chain.instance.addBlock(transaction, this.publicKey, signature.toDER('hex'));
    }

    signTransaction(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const signingKey = ec.keyFromPrivate(this.privateKey, 'hex');
        const signature = signingKey.sign(this.hashSHA256(transaction.toString()), 'base64');
        return signature
    }

    hashSHA256 = (data: any) => {
        const hash = crypto.createHash('SHA256');
        hash.update(data).end();
        return hash.digest('hex');
    }
}

export { Wallet };