import * as crypto from 'crypto';
import ec from "../constants/keygenerator"
class Transaction {
    [x: string]: any;

    // MARK:- Init
    constructor(
        public amount: number, // number of money
        public payer: string,  // address sender is thier public key
        public payee: string   // address receiver is thier puclic key
    ) { }

    // MARK:- Functions
    // toString() {
    //     return JSON.stringify(this);
    // }

    signTransaction(signingKey: any) {
        const sig = signingKey.sign(this.getTxHash(), 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid() {
        if (this.payer === "") return true;
        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }
        const publicKey = ec.keyFromPublic(this.payer, 'hex');
        return publicKey.verify(this.getTxHash(), this.signature);
    }

    getTxHash() {
        const hash = crypto.createHash('SHA256');
        hash.update(this.amount + this.payer + this.payee).end();
        return hash.digest('hex');
    }
}

export { Transaction };