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
exports.Block = void 0;
const crypto = __importStar(require("crypto"));
class Block {
    // MARK:- Init
    constructor(index, // index of block
    prevHash, // previous hash 
    transactions, // transactions
    curentHash = "", // hash this block
    nonce, // number to confirm a new block
    timestamp = Date.now()) {
        this.index = index;
        this.prevHash = prevHash;
        this.transactions = transactions;
        this.curentHash = curentHash;
        this.nonce = nonce;
        this.timestamp = timestamp;
    }
    // MARK:- Getter
    get hash() {
        const str = (this.index, +this.prevHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.curentHash = this.hash;
        }
    }
    hasValidTransaction() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }
        return true;
    }
}
exports.Block = Block;
