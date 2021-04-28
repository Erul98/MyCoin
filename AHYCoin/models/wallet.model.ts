import * as crypto from 'crypto';
import { Transaction } from "./transaction.model";
import { Chain } from "./chain.model";

class Wallet {

    // MARK:- Properties
    public publicKey: string;
    public privateKey: string;

    // MARK:- Init
    constructor(
        public money: number
    ) {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        this.publicKey = keypair.publicKey;
        this.privateKey = keypair.privateKey;
    }

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