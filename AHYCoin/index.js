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
    app.get('/api/v1/blocks', (req, res) => res.send(chain_model_1.Chain.instance.chain));
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
            if (chain_model_1.Chain.instance.chain.length <= 10) {
                chain_model_1.Chain.instance.tenBlockReward(publicKey);
            }
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
    app.post('/api/v1/transactions', async (req, res) => {
        const amount = chain_model_1.Chain.instance.getBlance(req.body.payerAdress);
        if (amount > req.body.amount) {
            const wallet = new wallet_model_1.Wallet(amount, req.body.privateKey, req.body.payerAdress);
            const status = wallet.sendMoney(req.body.amount, req.body.payeeAdress);
            if (status) {
                res.send({ status: 200, message: 'send money success' });
            }
            else {
                res.send({ status: 400, message: 'send money error' });
            }
        }
        else {
            res.send({ status: 400, message: 'send money error' });
        }
    });
    app.get('/api/v1/peers', (req, res) => {
        res.send(p2p.getSockets());
    });
    app.post('/api/v1/peers', (req, res) => {
        p2p.connectToPeers(req.body.peer);
        res.send();
    });
    app.listen(http_port, process.env.HOST, () => console.log('Listening http on port: ' + http_port));
};
const hashSHA256 = (str) => {
    const hash = crypto.createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
};
initHttpServer(httpPort);
p2p.initServer();
p2p.initP2PServer(p2pPort);
