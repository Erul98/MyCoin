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
const wallet_model_1 = require("./models/wallet.model");
const chain_model_1 = require("./models/chain.model");
const crypto = __importStar(require("crypto"));
const database_db_1 = require("./db/database.db");
const keygenerator_1 = __importDefault(require("./constants/keygenerator"));
const p2p = __importStar(require("./models/pear_to_pear"));
require('dotenv').config();
const express = require("express");
const bodyParser = require('body-parser');
const httpPort = parseInt(process.env.HTTP_PORT || "8080");
const p2pPort = parseInt(process.env.P2P_PORT || "6001");
var initHttpServer = (http_port) => {
    let app = express();
    app.use(bodyParser.json());
    app.get('/blocks', (req, res) => res.send(chain_model_1.Chain.instance.chain));
    app.post('/api/v1/wallet', async (req, res) => {
        try {
            // Create key pair
            const keyPair = keygenerator_1.default.genKeyPair();
            // Get private key 
            const privateKey = keyPair.getPrivate('hex');
            // Get public key
            const publicKey = keyPair.getPublic('hex');
            // Create wallet model
            const wallet = new wallet_model_1.Wallet(100, privateKey, publicKey);
            // Call db to save
            //await knex('users').insert({amount: wallet.amount, pkey: wallet.publicKey});
            // Response data
            res.send({ status: 201, body: wallet });
        }
        catch (e) {
            console.log(e);
            res.send({ status: 401, body: null });
        }
    });
    app.get('/api/v1/users', (req, res) => {
    });
    app.post('/api/v1/auth', async (req, res) => {
        try {
            // Create data virtial to verify private key to login in wallet
            const privateKey = req.body.key;
            const keyPair = keygenerator_1.default.keyFromPrivate(privateKey);
            // const list = await knex('users');
            // console.log(list);
            // var iCheck = false;
            // for (const _item of list) {
            // };
            res.send({ status: 200, body: {
                    amount: chain_model_1.Chain.instance.getBlance(keyPair.getPublic('hex')),
                    address: keyPair.getPublic('hex'),
                } });
        }
        catch (e) {
            console.log(e);
            res.send({ status: 400, body: null });
        }
    });
    app.post('/mineBlock', async (req, res) => {
        // let data_transaction = req.body.data.transaction;
        // let transaction = new Transaction(data_transaction.amount, data_transaction.payer, data_transaction.payee);
        // let senderPublicKey = req.body.data.senderPublicKey;
        // let signature = req.body.data.signature;
        const user = await database_db_1.knex('users').where('pkey', req.body.payerAdress);
        if (user.length !== 0) {
            const wallet = new wallet_model_1.Wallet(user.amount, req.body.privateKey, req.body.payerAdress);
            // const alice = new Wallet(100);
            wallet.sendMoney(50, req.body.payeeAdress);
            // bob.sendMoney(23, alice.publicKey);
            // alice.sendMoney(5, satoshi.publicKey);
            // broadcast(responseLatestMsg());
            // console.log('block added: ' + JSON.stringify(newBlock));
            res.send();
        }
    });
    // app.get('/peers', (req: any, res: any) => {
    //     res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    // });
    // app.post('/addPeer', (req: any, res: any) => {
    //     p2p.connectToPeers([req.body.peer]);
    //     res.send();
    // });
    app.listen(http_port, '192.168.1.5', () => console.log('Listening http on port: ' + http_port));
};
const hashSHA256 = (str) => {
    const hash = crypto.createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
};
initHttpServer(httpPort);
p2p.initP2PServer(p2pPort);
