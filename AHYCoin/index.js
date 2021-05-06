"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wallet_model_1 = require("./models/wallet.model");
const chain_model_1 = require("./models/chain.model");
var express = require("express");
var bodyParser = require('body-parser');
var WebSocket = require("ws");
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
    app.post('/mineBlock', (req, res) => {
        // let data_transaction = req.body.data.transaction;
        // let transaction = new Transaction(data_transaction.amount, data_transaction.payer, data_transaction.payee);
        // let senderPublicKey = req.body.data.senderPublicKey;
        // let signature = req.body.data.signature;
        // var newBlock = Chain.instance.addBlock(transaction, senderPublicKey, signature);
        const satoshi = new wallet_model_1.Wallet(100);
        const bob = new wallet_model_1.Wallet(100);
        const alice = new wallet_model_1.Wallet(100);
        satoshi.sendMoney(50, bob.publicKey);
        // bob.sendMoney(23, alice.publicKey);
        // alice.sendMoney(5, satoshi.publicKey);
        broadcast(responseLatestMsg());
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
