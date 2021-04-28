"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chain = void 0;
const crypto = __importStar(require("crypto"));
const block_model_1 = require("./block.model");
const transaction_model_1 = require("./transaction.model");
//
const BLOCK_GENERATION_INTERVAL = 10;
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;
//
class Chain {
    // MARK:- Init
    constructor() {
        // MARK:- Functions
        /**
         * Create genersis block
         * @returns Genersis block
         */
        this.genesisBlock = () => {
            const genesisBlock = new block_model_1.Block(0, "", Date.now(), new transaction_model_1.Transaction(1000000, "", ""), "", 1, 0);
            genesisBlock.curentHash = genesisBlock.hash;
            return genesisBlock;
        };
        /**
         *
         * @param newBlock
         * @param previousBlock
         * @returns
         */
        this.isValidNewBlock = (newBlock, previousBlock) => {
            if (newBlock.index + 1 !== newBlock.index) {
                console.log("invalid index");
                return false;
            }
            else if (previousBlock.curentHash !== newBlock.prevHash) {
                console.log("invalid hash");
                return false;
            }
            else if (this.calculateHash(newBlock) !== newBlock.curentHash) {
                console.log("invalide hash");
            }
        };
        /**
         *
         * @param newBlocks
         */
        this.replaceChain = (newBlocks) => {
            if (this.isValidChain(newBlocks) && newBlocks.length > this.chain.length) {
                console.log("Received Block Chain is Valid");
            }
        };
        /**
         *
         * @param blockToValidate
         * @returns
         */
        this.isValidChain = (blockToValidate) => {
            if (JSON.stringify(blockToValidate[0]) !== JSON.stringify(this.genesisBlock())) {
                return false;
            }
            var tempBlocks = [blockToValidate[0]];
            for (var i = 1; i < blockToValidate.length; i++) {
                if (this.isValidNewBlock(blockToValidate[i], tempBlocks[i - 1])) {
                    tempBlocks.push(blockToValidate[i]);
                }
                else {
                    return false;
                }
            }
            return true;
        };
        /**
         *
         * @param transaction
         * @returns
         */
        this.generateNextBlock = (transaction) => {
            const nextIndex = this.lastBlock.index + 1;
            const nextTimestamp = Date.now();
            const newBlock = new block_model_1.Block(nextIndex, this.lastBlock.curentHash, nextTimestamp, transaction, "", 0, 0);
            newBlock.curentHash = newBlock.hash;
            return newBlock;
        };
        /**
         *
         * @param newBlock
         * @returns
         */
        this.findBlock = (newBlock) => {
            var nonce = 0;
            //const tampBlock = this.chain;
            //tampBlock.push(newBlock);
            var difficulty = this.getDifficalty(this.chain);
            console.log("mining ........... ");
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
        };
        /**
         *
         * @param hash
         * @param difficulty
         * @returns
         */
        this.hashMatchesDifficulty = (hash, difficulty) => {
            var dif = "";
            for (var i = 0; i < difficulty; i++) {
                dif += "0";
            }
            if (hash.substr(0, difficulty) === dif) {
                return true;
            }
        };
        /**
         *
         * @param aBlockChain
         * @returns
         */
        this.getDifficalty = (aBlockChain) => {
            const lastBlock = aBlockChain[this.chain.length - 1];
            if (lastBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0
                && lastBlock.index !== 0) {
                return this.getAjustDifficalty(lastBlock, aBlockChain);
            }
            else {
                return lastBlock.difficulty;
            }
        };
        /**
         *
         * @param lastBlock
         * @param aBlockChain
         * @returns
         */
        this.getAjustDifficalty = (lastBlock, aBlockChain) => {
            const previousAjustmentBlock = aBlockChain[this.chain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
            const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
            const timeTaken = lastBlock.timestamp - previousAjustmentBlock.timestamp;
            if (timeTaken < timeExpected / 2) {
                return previousAjustmentBlock.difficulty + 1;
            }
            else if (timeTaken > timeExpected * 2) {
                return previousAjustmentBlock.difficulty - 1;
            }
            else {
                return previousAjustmentBlock.difficulty;
            }
        };
        this.chain = [this.genesisBlock()];
    }
    // MARK:- Getter
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    /**
     * Hash new block
     * @param newBlock
     * @returns newBlock has been hashed
     */
    calculateHash(newBlock) {
        const str = JSON.stringify(newBlock);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
    /**
     *
     * @param transaction
     * @param senderPublicKey
     * @param signature
     */
    addBlock(transaction, senderPublicKey, signature) {
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
exports.Chain = Chain;
// MARK:- SINGLETONE
Chain.instance = new Chain();
