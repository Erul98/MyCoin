import * as crypto from 'crypto';
import { Block } from "./block.model";
import { Transaction } from "./transaction.model";
import {broadcastLatest, broadCastTransactionPool, broadcastAll} from './pear_to_pear';
//
const BLOCK_GENERATION_INTERVAL: number = 10 * 60; // 10 minutes to find new Block
const DIFFICULTY_ADJUSTMENT_INTERVAL: number = 10; // limit 10 blocks to consider for up/down difficulty
//
class Chain {

    // MARK:- SINGLETONE
    public static instance = new Chain();

    // MARK:- Properties
    chain: Block[]; // this is block chain
    difficulty: number
    pendingTransaction: Transaction[]
    transactionPool: Transaction[]
    miningReward: number
    // MARK:- Init
    constructor() {
        this.chain = [this.genesisBlock()];
        this.difficulty = 1;
        this.pendingTransaction = [];
        this.transactionPool = [];
        this.miningReward = 0;
        this.statingMining();
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
        const genesisBlock = new Block(0, '', [new Transaction(1000000, 'Genersis Block Created', '044b38ebaf811999af23192526fe247fa9c685a05e4e55d6eaecf34302dfbf01eb76aa1b8c4b7b3563918576b303ecd14799f37e6e5f962410d35e93da49a825f2')], '', 0);
        genesisBlock.curentHash = genesisBlock.hash;
        return genesisBlock
    }

    tenBlockReward = (address: any) => {
        if (this.chain.length > 10) {
            return;
        }
        const block = new Block(0, this.lastBlock.curentHash, [new Transaction(100, 'Rewared', address)], '', 0);
        block.curentHash = block.hash;
        this.chain.push(block);
        broadcastAll(this.chain);
    }

    /**
     * To get genesis block
     * @returns genesis block
     */
    getGenesisBlock = () => {
        return this.chain[0];
    }

    getBlance = (address: any) => {
        let amount = 0;
        this.chain.forEach(itemChain => {
            itemChain.transactions.forEach(itemTx => {
                if (itemTx.payer === address) {
                    amount-=itemTx.amount
                }
                if (itemTx.payee === address) {
                    amount+=itemTx.amount
                }
            })
        });
        return amount;
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
        var tempBlocks = blockToValidate;
        for (var i = 1; i < blockToValidate.length; i++) {
            if (!blockToValidate[i].hasValidTransaction()) {
                return false;
            }
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
    generateNextBlock = (transactions: Transaction[]) => {
        const newBlock = new Block(this.lastBlock.index + 1, this.lastBlock.curentHash, transactions, "", 0);
        return newBlock;
    }

    /**
     * Find the block is mining operations to confirm a new block
     * @param newBlock 
     * @returns 
     */
    findBlock = (newBlock: Block) => {
        const getDifficalty = this.getDifficalty(this.chain);
        console.log("mining ........... ")
        newBlock.mineBlock(getDifficalty);
        return newBlock;
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
            return this.difficulty;                            // current difficulty
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
            return this.difficulty + 1;
        } else if (timeTaken > timeExpected * 2) {                                                      // time expected * 2 < time taken => difficulty - 1 (too difficulty)
            return this.difficulty - 1;
        } else {
            return this.difficulty
        }
    }

    /**
     * 
     * @param transaction 
     * @param senderPublicKey 
     * @param signature 
     */
    minePendingTransaction(miningRewardAddress: any) {
        if (this.pendingTransaction.length > 0) {
            const transactionsResolved = this.pendingTransaction;
            this.pendingTransaction = [];
            const nextBlock = this.generateNextBlock(transactionsResolved);
            // Minining
            const resolvedBlock = this.findBlock(nextBlock);
            console.log('mining completed: '+ resolvedBlock.nonce.toString());
            this.chain.push(resolvedBlock);
            broadcastAll(this.chain);
            broadcastLatest();
            this.getMiningReward(transactionsResolved);
            if (this.miningReward !== 0) {
                this.pendingTransaction.push(new Transaction(this.miningReward, "Reward", miningRewardAddress));
            } else {
                console.log("Have not reward");
            }
        } else {
            console.log("NULL");
        }
    }

    getMiningReward = (transactions: Transaction[]) => {
        this.miningReward = 0;
        if (transactions.length === 1 && transactions[0].payer === "Reward") {
            this.miningReward = 0;
        } else if (transactions.length > 0) {
            let sum = 0;
            transactions.forEach(element => {
                sum += element.amount;
            });
            if (sum * 0.1 < 0.0000001) {
                this.miningReward = 0.0000001
            } else {
                this.miningReward = Math.round(sum * 0.1 * 10000000) / 10000000
            }
        }
    }

    addTransaction(transaction: Transaction) {
        this.transactionPool.push(transaction);
        broadCastTransactionPool();
        this.transactionPool.forEach(element => {
            if (!element.payer || !element.payee) {
                return false;
                //throw new Error('Transaction must include payer & payee address');
            }
    
            if (!element.isValid()) {
                return false;
                //throw new Error('Cannot add valid transaction to chain');
            }
            const index = this.transactionPool.indexOf(element);
            if (index > -1) {
                this.transactionPool.splice(index, 1);
            }
            this.pendingTransaction.push(transaction);
        })
        return true;
    }

    statingMining = () => {
        setTimeout(() => {
            this.minePendingTransaction('044b38ebaf811999af23192526fe247fa9c685a05e4e55d6eaecf34302dfbf01eb76aa1b8c4b7b3563918576b303ecd14799f37e6e5f962410d35e93da49a825f2')
            this.statingMining()
        }, 10000)   
    }

    hashSHA256 = (str: any) => {
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}

export { Chain };