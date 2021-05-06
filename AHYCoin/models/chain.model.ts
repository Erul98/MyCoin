import * as crypto from 'crypto';
import { Block } from "./block.model";
import { Transaction } from "./transaction.model";
//
const BLOCK_GENERATION_INTERVAL: number = 10 * 60; // 10 minutes to find new Block
const DIFFICULTY_ADJUSTMENT_INTERVAL: number = 10; // limit 10 blocks to consider for up/down difficulty
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
        genesisBlock.curentHash = genesisBlock.hash;
        return genesisBlock
    }

    /**
     * To get genesis block
     * @returns genesis block
     */
    getGenesisBlock = () => {
        return this.chain[0];
    }

    /**
     * 
     * @param currentBlock 
     * @param previousBlock 
     * @returns 
     */
    isValidNewBlock = (currentBlock: Block, previousBlock: Block) => {
        if (previousBlock.index + 1 !== currentBlock.index) {
            console.log("invalid index");
            return false;
        } else if (previousBlock.curentHash !== currentBlock.prevHash) {
            console.log("invalid hash previous hash");
            return false;
        } else if (currentBlock.hash !== currentBlock.curentHash) {
            console.log("invalide hash current hash");
            return false;
        }
        return true;
    }

    /**
     * Replace this chain if the chain received is valid
     * @param newBlocks 
     */
    replaceChain = (newBlocks: Block[]) => {
        if (this.isValidChain(newBlocks) && newBlocks.length > this.chain.length) {
            console.log("Received Block Chain is Valid");
            this.chain = newBlocks;
        } else {
            console.log("Received Block Chain is invalid");
        }
    }

    /**
     * Check this chain is valid
     * @param blockToValidate 
     * @returns 
     */
    isValidChain = (blockToValidate: Block[]) => {
        console.log(JSON.stringify(blockToValidate[0]));
        //console.log(this.getGenesisBlock());
        if (JSON.stringify(blockToValidate[0]) !== JSON.stringify(this.getGenesisBlock())) {
            console.log("Genersis error!");
            return false;
        }
        var tempBlocks = [blockToValidate[0]];
        for (var i = 1; i < blockToValidate.length; i++) {
            if (this.isValidNewBlock(blockToValidate[i], tempBlocks[i - 1])) {
                tempBlocks.push(blockToValidate[i]);
            } else {
                console.log("invalid");
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
        const newBlock = new Block(this.lastBlock.index + 1, this.lastBlock.curentHash, 0, transaction, "", 0, 0);
        return newBlock;
    }

    /**
     * Find the block is mining operations to confirm a new block
     * @param newBlock 
     * @returns 
     */
    findBlock = (newBlock: Block) => {
        var nonce = 0;
        const getDifficalty = this.getDifficalty(this.chain);
        console.log("mining ........... ")
        while (true) {
            newBlock.nonce = nonce;
            const hash = newBlock.hash;
            if (this.hashMatchesDifficulty(hash, getDifficalty)) {
                console.log(nonce.toString());
                newBlock.difficulty = getDifficalty;
                return newBlock;
            }
            nonce++;
        }
    }

    /**
     * This hash has existed expected difficulty, example: difficulty = 1 same as "0" exists in hash string
     * @param hash 
     * @param difficulty 
     * @returns 
     */
    hashMatchesDifficulty = (hash: String, difficulty: number) => {
        if (hash.substr(0, difficulty) === Array(difficulty + 1).join("0")) {
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
            && lastBlock.index !== 0) {                             // 10 blocks added 
            return this.getAjustDifficalty(lastBlock, aBlockChain); // up/down difficulty 
        } else {
            return lastBlock.difficulty;                            // current difficulty
        }
    }

    /**
     * 
     * @param lastBlock 
     * @param aBlockChain 
     * @returns 
     */
    getAjustDifficalty = (lastBlock: Block, aBlockChain: Block[]) => {
        const previousAjustmentBlock = aBlockChain[this.chain.length - DIFFICULTY_ADJUSTMENT_INTERVAL]; // previous 10 blocks added
        const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;                // expected time = constance time * number of blocks
        const timeTaken = lastBlock.timestamp - previousAjustmentBlock.timestamp;                       // lasted block to 10 blocks
        if (timeTaken < timeExpected / 2) {                                                             // time expected > 2 * time taken => difficulty down 1 (too easy)
            return previousAjustmentBlock.difficulty + 1;
        } else if (timeTaken > timeExpected * 2) {                                                      // time expected * 2 < time taken => difficulty - 1 (too difficulty)
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
        // verify signature = public key of sender + signature
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        if (isValid) {
            // Basic proof of work
            const nextBlock = this.generateNextBlock(transaction);
            // Minining
            const resolvedBlock = this.findBlock(nextBlock);
            //
            nextBlock.timestamp = Date.now();
            nextBlock.curentHash = nextBlock.hash;
            this.chain.push(resolvedBlock);
        }
    }
}

export { Chain };