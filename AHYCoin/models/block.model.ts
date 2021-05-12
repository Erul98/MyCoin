import * as crypto from 'crypto';
import { Transaction } from "./transaction.model";

class Block {

    // MARK:- Init
    constructor(
        public index: number,                     // index of block
        public prevHash: string,                  // previous hash 
        public transactions: Transaction[],       // transactions
        public curentHash: string = "",           // hash this block
        public nonce: number,                     // number to confirm a new block
        public timestamp = Date.now(),            // time new block is created
    ) { }

    // MARK:- Getter
    get hash() {
        const str = (this.index, + this.prevHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }

    mineBlock(difficulty: any) {
        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.curentHash = this.hash;
        }
    }

    hasValidTransaction() {
        for(const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }
        return true;
    }
}

export { Block };