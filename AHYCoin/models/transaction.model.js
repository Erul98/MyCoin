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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const crypto = __importStar(require("crypto"));
const keygenerator_1 = __importDefault(require("../constants/keygenerator"));
class Transaction {
    // MARK:- Init
    constructor(amount, // number of money
    payer, // address sender is thier public key
    payee // address receiver is thier puclic key
    ) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    // MARK:- Functions
    // toString() {
    //     return JSON.stringify(this);
    // }
    signTransaction(signingKey) {
        const sig = signingKey.sign(this.getTxHash(), 'base64');
        this.signature = sig.toDER('hex');
    }
    isValid() {
        if (this.payer === "")
            return true;
        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }
        const publicKey = keygenerator_1.default.keyFromPublic(this.payer, 'hex');
        return publicKey.verify(this.getTxHash(), this.signature);
    }
    getTxHash() {
        const hash = crypto.createHash('SHA256');
        hash.update(this.amount + this.payer + this.payee).end();
        return hash.digest('hex');
    }
}
exports.Transaction = Transaction;
