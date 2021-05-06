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
exports.Wallet = void 0;
const crypto = __importStar(require("crypto"));
const secp256k1 = __importStar(require("secp256k1"));
const transaction_model_1 = require("./transaction.model");
const chain_model_1 = require("./chain.model");
class Wallet {
    // MARK:- Init
    constructor(money) {
        this.money = money;
        // generate privKey
        do {
            this.privateKey = crypto.randomBytes(32).toString();
            console.log(this.privateKey);
        } while (!secp256k1.privateKeyVerify(Buffer.from(this.privateKey, 'hex')));
        // get the public key in a compressed format
        this.publicKey = secp256k1.publicKeyCreate(Buffer.from(this.privateKey, 'hex')).toString();
    }
    // MARK: - Functions
    sendMoney(amount, payeePublicKey) {
        const transaction = new transaction_model_1.Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey);
        chain_model_1.Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
exports.Wallet = Wallet;
