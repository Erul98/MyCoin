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
            if (Chain.instance.chain.length <= 10) {
                Chain.instance.tenBlockReward(publicKey);
            }
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
            res.send({status: 200, body: {
                amount: Chain.instance.getBlance(keyPair.getPublic('hex')),
                address: keyPair.getPublic('hex'),
            }});
        } catch (e) {
            console.log(e);
            res.send({status: 400, body: null});
        }
    });

    app.post('/transaction', async(req: any, res: any) => {
        const amount = Chain.instance.getBlance(req.body.payerAdress);
        if (amount > req.body.amount) {
            const wallet = new Wallet(amount, req.body.privateKey, req.body.payerAdress);
            const status = wallet.sendMoney(req.body.amount, req.body.payeeAdress);
            if (status) {
                res.send({status: 200, message: 'send money success'});   
            } else {
                res.send({status: 400, message: 'send money error'});   
            }
        } else {
            res.send({status: 400, message: 'send money error'});   
        }
    });

    app.get('/peers', (req: any, res: any) => {
        res.send(p2p.getSockets());
    });

    app.post('/addPeer', (req: any, res: any) => {
        p2p.connectToPeers(req.body.peer);
        res.send();
    });
    app.listen(http_port, process.env.HOST, () => console.log('Listening http on port: ' + http_port));
};

const hashSHA256 = (str: any) => {
    const hash = crypto.createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
}

initHttpServer(httpPort);
p2p.initServer();
p2p.initP2PServer(p2pPort);