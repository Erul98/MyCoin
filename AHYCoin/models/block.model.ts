import * as crypto from 'crypto';
import { Transaction } from "./transaction.model";

class Block {

    // MARK:- Init
    constructor(
        public index: number,                     // index of block
        public prevHash: string,                  // previous hash 
        public timestamp: number,            // time new block is created
        public transactions: Transaction[],          // transactions
        public curentHash: string = "",           // hash this block
        public nonce: number                      // number to confirm a new block
    ) { }

    // MARK:- Getter
    get hash() {
        const str = JSON.stringify({ index: this.index, prevHash: this.prevHash, timestamp: this.timestamp, transaction: this.transactions, nonce: this.nonce });
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}

export { Block };