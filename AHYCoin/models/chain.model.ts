import * as crypto from 'crypto';
import { Block } from "./block.model";
import { Transaction } from "./transaction.model";
//
const BLOCK_GENERATION_INTERVAL: number = 10;
const DIFFICULTY_ADJUSTMENT_INTERVAL: number = 10;
//
class Chain {

    // MARK:- SINGLETONE
    public static instance = new Chain();

    // MARK:- Properties
    chain: Block[]; // this is block chain

    // MARK:- Init
    constructor() {
        this.chain = [this.genesisBlock()];
    }

    // MARK:- Getter
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    // MARK:- Functions
    /**
     * Create genersis block
     * @returns Genersis block
     */
    genesisBlock = () => {
        const genesisBlock = new Block(0, "", Date.now(), new Transaction(1000000, "", ""), "", 1, 0);
        genesisBlock.curentHash = genesisBlock.hash
        return genesisBlock
    }

    /**
     * Hash new block
     * @param newBlock 
     * @returns newBlock has been hashed
     */
    calculateHash(newBlock: Block) {
        const str = JSON.stringify(newBlock);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }

    /**
     * 
     * @param newBlock 
     * @param previousBlock 
     * @returns 
     */
    isValidNewBlock = (newBlock: Block, previousBlock: Block) => {
        if (newBlock.index + 1 !== newBlock.index) {
            console.log("invalid index");
            return false;
        } else if (previousBlock.curentHash !== newBlock.prevHash) {
            console.log("invalid hash");
            return false;
        } else if (this.calculateHash(newBlock) !== newBlock.curentHash) {
            console.log("invalide hash");
        }
    }

    /**
     * 
     * @param newBlocks 
     */
    replaceChain = (newBlocks: Block[]) => {
        if (this.isValidChain(newBlocks) && newBlocks.length > this.chain.length) {
            console.log("Received Block Chain is Valid");

        }
    }

    /**
     * 
     * @param blockToValidate 
     * @returns 
     */
    isValidChain = (blockToValidate: Block[]) => {
        if (JSON.stringify(blockToValidate[0]) !== JSON.stringify(this.genesisBlock())) {
            return false;
        }
        var tempBlocks = [blockToValidate[0]];
        for (var i = 1; i < blockToValidate.length; i++) {
            if (this.isValidNewBlock(blockToValidate[i], tempBlocks[i - 1])) {
                tempBlocks.push(blockToValidate[i]);
            } else {
                return false;
            }
        }
        return true;
    }

    /**
     * 
     * @param transaction 
     * @returns 
     */
    generateNextBlock = (transaction: Transaction) => {
        const nextIndex = this.lastBlock.index + 1;
        const nextTimestamp = Date.now();
        const newBlock = new Block(nextIndex, this.lastBlock.curentHash, nextTimestamp, transaction, "", 0, 0);
        newBlock.curentHash = newBlock.hash;
        return newBlock;
    }

    /**
     * 
     * @param newBlock 
     * @returns 
     */
    findBlock = (newBlock: Block) => {
        var nonce = 0;
        //const tampBlock = this.chain;
        //tampBlock.push(newBlock);
        var difficulty = this.getDifficalty(this.chain);
        console.log("mining ........... ")
        while (true) {
            newBlock.nonce = nonce;
            const hash = this.calculateHash(newBlock);
            if (this.hashMatchesDifficulty(hash, difficulty)) {
                console.log(nonce.toString());
                newBlock.difficulty = difficulty;
                return newBlock;
            }
            nonce++;
        }
    }

    /**
     * 
     * @param hash 
     * @param difficulty 
     * @returns 
     */
    hashMatchesDifficulty = (hash: String, difficulty: number) => {
        var dif = "";
        for (var i = 0; i < difficulty; i++) {
            dif += "0";
        }
        if (hash.substr(0, difficulty) === dif) {
            return true;
        }
    }

    /**
     * 
     * @param aBlockChain 
     * @returns 
     */
    getDifficalty = (aBlockChain: Block[]) => {
        const lastBlock = aBlockChain[this.chain.length - 1]
        if (lastBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0
            && lastBlock.index !== 0) {
            return this.getAjustDifficalty(lastBlock, aBlockChain);
        } else {
            return lastBlock.difficulty;
        }
    }

    /**
     * 
     * @param lastBlock 
     * @param aBlockChain 
     * @returns 
     */
    getAjustDifficalty = (lastBlock: Block, aBlockChain: Block[]) => {
        const previousAjustmentBlock = aBlockChain[this.chain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
        const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
        const timeTaken = lastBlock.timestamp - previousAjustmentBlock.timestamp;
        if (timeTaken < timeExpected / 2) {
            return previousAjustmentBlock.difficulty + 1;
        } else if (timeTaken > timeExpected * 2) {
            return previousAjustmentBlock.difficulty - 1;
        } else {
            return previousAjustmentBlock.difficulty
        }
    }

    /**
     * 
     * @param transaction 
     * @param senderPublicKey 
     * @param signature 
     */
    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);

        if (isValid) {
            // Basic proof of work
            const nextBlock = this.generateNextBlock(transaction);
            // Minining
            const resolvedBlock = this.findBlock(nextBlock);

            this.chain.push(resolvedBlock);
        }
    }
}

export { Chain };