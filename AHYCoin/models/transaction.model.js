"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
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
    toString() {
        return JSON.stringify(this);
    }
}
exports.Transaction = Transaction;
