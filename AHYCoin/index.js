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
const wallet_model_1 = require("./models/wallet.model");
const chain_model_1 = require("./models/chain.model");
const crypto = __importStar(require("crypto"));
const database_db_1 = require("./db/database.db");
const bitcoin = __importStar(require("bitcoinjs-lib"));
const express = require("express");
const bodyParser = require('body-parser');
const WebSocket = require("ws");
const CryptoJS = require('crypto-js');
require('dotenv').config();
// MARK:- Variable
var http_port = process.env.HTTP_PORT || 3001;
var p2p_port = process.env.P2P_PORT || 6001;
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];
var sockets = [];
var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};
var initHttpServer = () => {
    let app = express();
    app.use(bodyParser.json());
    app.get('/blocks', (req, res) => res.send(chain_model_1.Chain.instance.chain));
    app.post('/api/v1/wallet', async (req, res) => {
        try {
            // const keypair = crypto.generateKeyPairSync('rsa', {
            //     modulusLength: 2048,
            //     publicKeyEncoding: { type: 'spki', format: 'pem' },
            //     privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
            // });
            const data = Date.now();
            const keyPair = bitcoin.ECPair.makeRandom();
            const address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
            const publicKey = keyPair.publicKey;
            const privateKey_WIF = keyPair.toWIF();
            console.log(privateKey_WIF);
            const privateKey = keyPair.privateKey;
            const wallet = new wallet_model_1.Wallet(100, privateKey.toString('hex'), publicKey.toString("hex"));
            await database_db_1.knex('users').insert({ amount: wallet.amount, pkey: wallet.publicKey });
            res.send({ status: 201, body: { amount: wallet.amount, private_key: wallet.privateKey, address: address.address } });
        }
        catch (e) {
            console.log(e);
            res.send({ status: 401, body: null });
        }
    });
    app.get('/api/v1/users', (req, res) => {
    });
    app.post('/api/v1/my_wallet', async (req, res) => {
        try {
            const data = Date.now().toString();
            const privateKey = req.body.key;
            const keyPair_PR = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
            const sign = keyPair_PR.sign(Buffer.from(hashSHA256(data), 'hex'));
            const list = await database_db_1.knex('users');
            // console.log(list);
            var iCheck = false;
            for (const _item of list) {
                console.log(_item.pkey);
                const keyPair_PB = bitcoin.ECPair.fromPublicKey(Buffer.from(_item.pkey, 'hex'));
                const verifyStatus = keyPair_PB.verify(Buffer.from(hashSHA256(data), 'hex'), sign);
                console.log(verifyStatus);
                if (verifyStatus) {
                    iCheck = true;
                    _item.pkey = _item.pkey;
                    res.send({ status: 200, body: _item });
                    return;
                }
            }
            ;
            res.send({ status: 401, body: null });
        }
        catch (e) {
            console.log(e);
            res.send({ status: 400, body: null });
        }
    });
    app.post('/mineBlock', (req, res) => {
        // let data_transaction = req.body.data.transaction;
        // let transaction = new Transaction(data_transaction.amount, data_transaction.payer, data_transaction.payee);
        // let senderPublicKey = req.body.data.senderPublicKey;
        // let signature = req.body.data.signature;
        // var newBlock = Chain.instance.addBlock(transaction, senderPublicKey, signature);
        // const satoshi = new Wallet(100);
        // const bob = new Wallet(100);
        // const alice = new Wallet(100);
        // satoshi.sendMoney(50, bob.publicKey);
        // bob.sendMoney(23, alice.publicKey);
        // alice.sendMoney(5, satoshi.publicKey);
        // broadcast(responseLatestMsg());
        // console.log('block added: ' + JSON.stringify(newBlock));
        res.send();
    });
    app.get('/peers', (req, res) => {
        res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });
    app.post('/addPeer', (req, res) => {
        connectToPeers([req.body.peer]);
        res.send();
    });
    app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
};
const hashSHA256 = (str) => {
    const hash = crypto.createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
};
var initP2PServer = () => {
    var server = new WebSocket.Server({ port: p2p_port });
    server.on('connection', (ws) => initConnection(ws));
    console.log('listening websocket p2p port on: ' + p2p_port);
};
const connectToPeers = (newPeers) => {
    newPeers.forEach((peer) => {
        var ws = new WebSocket(peer);
        ws.on('open', () => initConnection(ws));
        ws.on('error', () => {
            console.log('connection failed');
        });
    });
};
const initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};
var initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        var message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message.data));
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg());
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                //Chain.instance.isValidChain(JSON.parse(message.data));
                break;
        }
    });
};
var initErrorHandler = (ws) => {
    var closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};
var getLatestBlock = () => chain_model_1.Chain.instance.lastBlock;
var blockchain = chain_model_1.Chain.instance.chain;
var queryChainLengthMsg = () => ({ 'type': MessageType.QUERY_LATEST });
var queryAllMsg = () => ({ 'type': MessageType.QUERY_ALL });
var responseChainMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(blockchain)
});
var responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([getLatestBlock()])
});
var write = (ws, message) => ws.send(JSON.stringify(message));
var broadcast = (message) => sockets.forEach(socket => write(socket, message));
connectToPeers(initialPeers);
initHttpServer();
initP2PServer();
// const satoshi = new Wallet(100);
// const bob = new Wallet(100);
// const alice = new Wallet(100);
// satoshi.sendMoney(50, bob.publicKey);
// bob.sendMoney(23, alice.publicKey);
// alice.sendMoney(5, satoshi.publicKey);
// Chain.instance.chain.forEach(element => {
//     switch (element.transaction.payee) {
//         case satoshi.publicKey:
//             satoshi.money += element.transaction.amount;
//             break
//         case alice.publicKey:
//             alice.money += element.transaction.amount;
//             break
//         case bob.publicKey:
//             bob.money += element.transaction.amount;
//             break
//     }
//     //
//     switch (element.transaction.payer) {
//         case satoshi.publicKey:
//             satoshi.money -= element.transaction.amount;
//             break
//         case alice.publicKey:
//             alice.money -= element.transaction.amount;
//             break
//         case bob.publicKey:
//             bob.money -= element.transaction.amount;
//             break
//     }
// });
// // const blockChain = new Chain();
// // for (var i = 1; i < Chain.instance.chain.length; i++) {
// //     let block = Chain.instance.chain[i];
// //     blockChain.chain.push(new Block(block.index, block.prevHash, block.timestamp, block.transaction, block.curentHash, block.difficulty, block.nonce));
// // }
// // blockChain.chain[1].curentHash = "";
// console.log(Chain.instance.chain[1].transaction);
// console.log(Chain.instance.isValidChain(Chain.instance.chain));
// console.log(satoshi.money);
// console.log(alice.money);
// console.log(bob.money);
