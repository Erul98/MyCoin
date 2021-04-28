class Transaction {

    // MARK:- Init
    constructor(
        public amount: number, // number of money
        public payer: string,  // address sender is thier public key
        public payee: string   // address receiver is thier puclic key
    ) { }

    // MARK:- Functions
    toString() {
        return JSON.stringify(this);
    }
}

export { Transaction };