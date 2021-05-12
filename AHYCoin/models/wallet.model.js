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
exports.Wallet = void 0;
const crypto = __importStar(require("crypto"));
const transaction_model_1 = require("./transaction.model");
const chain_model_1 = require("./chain.model");
const keygenerator_1 = __importDefault(require("../constants/keygenerator"));
class Wallet {
    // MARK:- Init
    constructor(amount, privateKey, publicKey) {
        this.amount = amount;
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.hashSHA256 = (data) => {
            const hash = crypto.createHash('SHA256');
            hash.update(data).end();
            return hash.digest('hex');
        };
    }
    // MARK: - Functions
    sendMoney(amount, payeePublicKey) {
        const transaction = new transaction_model_1.Transaction(amount, this.publicKey, payeePublicKey);
        const signingKey = keygenerator_1.default.keyFromPrivate(this.privateKey, 'hex');
        transaction.signTransaction(signingKey);
        chain_model_1.Chain.instance.addTransaction(transaction);
    }
}
exports.Wallet = Wallet;
