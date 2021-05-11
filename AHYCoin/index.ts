import { Wallet } from "./models/wallet.model";
import { Chain } from "./models/chain.model";
import { Block } from "./models/block.model";
import { Transaction } from "./models/transaction.model";
import * as crypto from 'crypto';
import { knex } from "./db/database.db";
import ec from "./constants/keygenerator";
import * as p2p from "./models/pear_to_pear";
require('dotenv').config();

const express = require("express");
const bodyParser = require('body-parser'); 

const httpPort: number = parseInt(process.env.HTTP_PORT || "8080");
const p2pPort: number = parseInt(process.env.P2P_PORT || "6001");

var initHttpServer = (http_port: number) => {
    let app = express();
    app.use(bodyParser.json());

    app.get('/blocks', (req: any, res: any) => res.send(Chain.instance.chain));

    app.post('/api/v1/wallet', async (req: any, res: any) => {
        try {
            // Create key pair
            const keyPair = ec.genKeyPair();
            // Get private key 
            const privateKey = keyPair.getPrivate('hex');
            // Get public key
            const publicKey = keyPair.getPublic('hex');
            // Create wallet model
            const wallet = new Wallet(100, privateKey, publicKey);
            // Call db to save
            //await knex('users').insert({amount: wallet.amount, pkey: wallet.publicKey});
            // Response data
            res.send({status: 201, body: wallet});
        } catch (e) {
            console.log(e);
            res.send({status: 401, body: null});
        }
    });

    app.get('/api/v1/users', (req: any, res: any) => {
        
    });

    app.post('/api/v1/auth', async (req: any, res: any) => {
        try {
            // Create data virtial to verify private key to login in wallet
            const privateKey = req.body.key;
            const keyPair = ec.keyFromPrivate(privateKey);
            // const list = await knex('users');
            // console.log(list);
            // var iCheck = false;
            // for (const _item of list) {
                
            // };
            res.send({status: 200, body: {
                amount: Chain.instance.getBlance(keyPair.getPublic('hex')),
                address: keyPair.getPublic('hex'),
            }});
        } catch (e) {
            console.log(e);
            res.send({status: 400, body: null});
        }
    });

    app.post('/mineBlock', async(req: any, res: any) => {

        // let data_transaction = req.body.data.transaction;
        // let transaction = new Transaction(data_transaction.amount, data_transaction.payer, data_transaction.payee);
        // let senderPublicKey = req.body.data.senderPublicKey;
        // let signature = req.body.data.signature;
        const user = await knex('users').where('pkey', req.body.payerAdress);
        if (user.length !== 0) {
            const wallet = new Wallet(user.amount, req.body.privateKey, req.body.payerAdress);
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

const hashSHA256 = (str: any) => {
    const hash = crypto.createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
}

initHttpServer(httpPort);
p2p.initP2PServer(p2pPort);