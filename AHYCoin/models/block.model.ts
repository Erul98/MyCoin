import * as crypto from 'crypto';
import { Transaction } from "./transaction.model";

class Block {

    // MARK:- Init
    constructor(
        public index: number,                     // index of block
        public prevHash: string,                  // previous hash 
        public timestamp: number,            // time new block is created
        public transaction: Transaction,          // a transaction
        public curentHash: string = "",           // hash this block
        public difficulty: number,                // difficulty for confirm a new block
        public nonce: number                      // number to confirm a new block
    ) { }

    // MARK:- Getter
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}

export { Block };