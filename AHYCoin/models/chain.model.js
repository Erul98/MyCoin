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
const pear_to_pear_1 = require("./pear_to_pear");
//
const BLOCK_GENERATION_INTERVAL = 10 * 60; // 10 minutes to find new Block
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10; // limit 10 blocks to consider for up/down difficulty
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
            const genesisBlock = new block_model_1.Block(0, '', [new transaction_model_1.Transaction(1000000, 'Genersis Block Created', '044b38ebaf811999af23192526fe247fa9c685a05e4e55d6eaecf34302dfbf01eb76aa1b8c4b7b3563918576b303ecd14799f37e6e5f962410d35e93da49a825f2')], '', 0);
            genesisBlock.curentHash = genesisBlock.hash;
            return genesisBlock;
        };
        this.tenBlockReward = (address) => {
            if (this.chain.length > 10) {
                return;
            }
            const block = new block_model_1.Block(0, this.lastBlock.curentHash, [new transaction_model_1.Transaction(100, 'Rewared', address)], '', 0);
            block.curentHash = block.hash;
            this.chain.push(block);
            pear_to_pear_1.broadcastAll(this.chain);
        };
        /**
         * To get genesis block
         * @returns genesis block
         */
        this.getGenesisBlock = () => {
            return this.chain[0];
        };
        this.getBlance = (address) => {
            let amount = 0;
            this.chain.forEach(itemChain => {
                itemChain.transactions.forEach(itemTx => {
                    if (itemTx.payer === address) {
                        amount -= itemTx.amount;
                    }
                    if (itemTx.payee === address) {
                        amount += itemTx.amount;
                    }
                });
            });
            return amount;
        };
        /**
         *
         * @param currentBlock
         * @param previousBlock
         * @returns
         */
        this.isValidNewBlock = (currentBlock, previousBlock) => {
            if (previousBlock.index + 1 !== currentBlock.index) {
                console.log("invalid index");
                return false;
            }
            else if (previousBlock.curentHash !== currentBlock.prevHash) {
                console.log("invalid hash previous hash");
                return false;
            }
            else if (currentBlock.hash !== currentBlock.curentHash) {
                console.log("invalide hash current hash");
                return false;
            }
            return true;
        };
        /**
         * Replace this chain if the chain received is valid
         * @param newBlocks
         */
        this.replaceChain = (newBlocks) => {
            if (this.isValidChain(newBlocks) && newBlocks.length > this.chain.length) {
                console.log("Received Block Chain is Valid");
                this.chain = newBlocks;
            }
            else {
                console.log("Received Block Chain is invalid");
            }
        };
        /**
         * Check this chain is valid
         * @param blockToValidate
         * @returns
         */
        this.isValidChain = (blockToValidate) => {
            console.log(JSON.stringify(blockToValidate[0]));
            //console.log(this.getGenesisBlock());
            if (JSON.stringify(blockToValidate[0]) !== JSON.stringify(this.getGenesisBlock())) {
                console.log("Genersis error!");
                return false;
            }
            var tempBlocks = blockToValidate;
            for (var i = 1; i < blockToValidate.length; i++) {
                if (!blockToValidate[i].hasValidTransaction()) {
                    return false;
                }
                if (this.isValidNewBlock(blockToValidate[i], tempBlocks[i - 1])) {
                    tempBlocks.push(blockToValidate[i]);
                }
                else {
                    console.log("invalid");
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
        this.generateNextBlock = (transactions) => {
            const newBlock = new block_model_1.Block(this.lastBlock.index + 1, this.lastBlock.curentHash, transactions, "", 0);
            return newBlock;
        };
        /**
         * Find the block is mining operations to confirm a new block
         * @param newBlock
         * @returns
         */
        this.findBlock = (newBlock) => {
            const getDifficalty = this.getDifficalty(this.chain);
            console.log("mining ........... ");
            newBlock.mineBlock(getDifficalty);
            return newBlock;
        };
        /**
         *
         * @param aBlockChain
         * @returns
         */
        this.getDifficalty = (aBlockChain) => {
            const lastBlock = aBlockChain[this.chain.length - 1];
            if (lastBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0
                && lastBlock.index !== 0) { // 10 blocks added 
                return this.getAjustDifficalty(lastBlock, aBlockChain); // up/down difficulty 
            }
            else {
                return this.difficulty; // current difficulty
            }
        };
        /**
         *
         * @param lastBlock
         * @param aBlockChain
         * @returns
         */
        this.getAjustDifficalty = (lastBlock, aBlockChain) => {
            const previousAjustmentBlock = aBlockChain[this.chain.length - DIFFICULTY_ADJUSTMENT_INTERVAL]; // previous 10 blocks added
            const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL; // expected time = constance time * number of blocks
            const timeTaken = lastBlock.timestamp - previousAjustmentBlock.timestamp; // lasted block to 10 blocks
            if (timeTaken < timeExpected / 2) { // time expected > 2 * time taken => difficulty down 1 (too easy)
                return this.difficulty + 1;
            }
            else if (timeTaken > timeExpected * 2) { // time expected * 2 < time taken => difficulty - 1 (too difficulty)
                return this.difficulty - 1;
            }
            else {
                return this.difficulty;
            }
        };
        this.hashSHA256 = (str) => {
            const hash = crypto.createHash('SHA256');
            hash.update(str).end();
            return hash.digest('hex');
        };
        this.chain = [this.genesisBlock()];
        this.difficulty = 1;
        this.pendingTransaction = [];
        this.miningReward = 10;
    }
    // MARK:- Getter
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    /**
     *
     * @param transaction
     * @param senderPublicKey
     * @param signature
     */
    minePendingTransaction(miningRewardAddress) {
        const nextBlock = this.generateNextBlock(this.pendingTransaction);
        // Minining
        const resolvedBlock = this.findBlock(nextBlock);
        console.log('mining completed: ' + resolvedBlock.nonce.toString());
        this.chain.push(resolvedBlock);
        this.pendingTransaction = [];
        pear_to_pear_1.broadcastAll(this.chain);
        pear_to_pear_1.broadcastLatest();
        this.pendingTransaction.push(new transaction_model_1.Transaction(this.miningReward, "Reward", miningRewardAddress));
    }
    addTransaction(transaction) {
        if (!transaction.payer || !transaction.payee) {
            return false;
            //throw new Error('Transaction must include payer & payee address');
        }
        if (!transaction.isValid()) {
            return false;
            //throw new Error('Cannot add valid transaction to chain');
        }
        this.pendingTransaction.push(transaction);
        this.minePendingTransaction('044b38ebaf811999af23192526fe247fa9c685a05e4e55d6eaecf34302dfbf01eb76aa1b8c4b7b3563918576b303ecd14799f37e6e5f962410d35e93da49a825f2');
        pear_to_pear_1.broadCastTransactionPool();
        return true;
    }
}
exports.Chain = Chain;
// MARK:- SINGLETONE
Chain.instance = new Chain();
