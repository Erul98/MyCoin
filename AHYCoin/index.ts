import { Wallet } from "./models/wallet.model";
import { Chain } from "./models/chain.model";
import { Block } from "./models/block.model";
import { Transaction } from "./models/transaction.model";
import * as crypto from 'crypto';
import { knex } from "./db/database.db";
import * as bitcoin from 'bitcoinjs-lib';

const express = require("express");
const bodyParser = require('body-parser');
const WebSocket = require("ws");

require('dotenv').config();

// MARK:- Variable
var http_port = process.env.HTTP_PORT || 3001;
var p2p_port = process.env.P2P_PORT || 6001;
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

var sockets: any[] = [];
var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};

var initHttpServer = () => {
    let app = express();
    app.use(bodyParser.json());

    app.get('/blocks', (req: any, res: any) => res.send(Chain.instance.chain));

    app.post('/api/v1/wallet', async (req: any, res: any) => {
        try {
            // Create key pair
            const keyPair = bitcoin.ECPair.makeRandom();
            // Get private key 
            const privateKey = keyPair.privateKey;
            // Get public key
            const publicKey = keyPair.publicKey;
            // Get address
            const address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
            // Create wallet model
            const wallet = new Wallet(100, (privateKey as Buffer).toString('hex'), publicKey.toString("hex"));
            // Call db to save
            await knex('users').insert({amount: wallet.amount, pkey: wallet.publicKey});
            // Response data
            res.send({status: 201, body: {amount: wallet.amount, private_key: wallet.privateKey, address: address.address}});
        } catch (e) {
            console.log(e);
            res.send({status: 401, body: null});
        }
    });

    app.get('/api/v1/users', (req: any, res: any) => {
        
    });

    app.post('/api/v1/my_wallet', async (req: any, res: any) => {
        try {
            // Create data virtial to verify private key to login in wallet
            const data = Date.now().toString();
            const privateKey = req.body.key;
            // Create ECPair from private key
            const keyPair_PR = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
            // Signing the data virtial
            const sign = keyPair_PR.sign(Buffer.from(hashSHA256(data), 'hex'));
            const list = await knex('users');
            // console.log(list);
            var iCheck = false;
            for (const _item of list) { 
                //console.log(_item.pkey);
                // Create ECPair from public key
                const keyPair_PB = bitcoin.ECPair.fromPublicKey(Buffer.from(_item.pkey, 'hex'));
                // Verify signing above with virtial data
                const verifyStatus = keyPair_PB.verify(Buffer.from(hashSHA256(data), 'hex'), sign);
                //console.log(verifyStatus);
                if (verifyStatus) {
                    iCheck = true;
                    _item.pkey = _item.pkey;
                    res.send({status: 200, body: _item});
                    return;
                }
            };
            res.send({status: 401, body: null});
        } catch (e) {
            console.log(e);
            res.send({status: 400, body: null});
        }
    });

    app.post('/mineBlock', (req: any, res: any) => {

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
    app.get('/peers', (req: any, res: any) => {
        res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });
    app.post('/addPeer', (req: any, res: any) => {
        connectToPeers([req.body.peer]);
        res.send();
    });
    app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
};

const hashSHA256 = (str: any) => {
    const hash = crypto.createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
}

var initP2PServer = () => {
    var server = new WebSocket.Server({ port: p2p_port });
    server.on('connection', (ws: any) => initConnection(ws));
    console.log('listening websocket p2p port on: ' + p2p_port);

};

const connectToPeers = (newPeers: any) => {
    newPeers.forEach((peer: any) => {
        var ws = new WebSocket(peer);
        ws.on('open', () => initConnection(ws));
        ws.on('error', () => {
            console.log('connection failed')
        });
    });
};

const initConnection = (ws: any) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};

var initMessageHandler = (ws: any) => {
    ws.on('message', (data: any) => {
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

var initErrorHandler = (ws: any) => {
    var closeConnection = (ws: any) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

var getLatestBlock = () => Chain.instance.lastBlock;
var blockchain = Chain.instance.chain;
var queryChainLengthMsg = () => ({ 'type': MessageType.QUERY_LATEST });
var queryAllMsg = () => ({ 'type': MessageType.QUERY_ALL });
var responseChainMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(blockchain)
});
var responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([getLatestBlock()])
});

var write = (ws: any, message: any) => ws.send(JSON.stringify(message));
var broadcast = (message: any) => sockets.forEach(socket => write(socket, message));

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