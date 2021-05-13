# AHY Coin
## _Block chain application project_

AHY Coin using nodejs to build

## Features
- Created account through elliptic-curve cryptography
- Login using privatekey
- Send coin to other address
- Server will receive transaction. After that execute check transaction valid end add to transaction pool
- When number of transactions greater than or equal to 2 will executed proof of work to find the block
- When 1 block has been found this block will be add the chain and notify to everyone and client application

## Installation

AHY requires [Node.js](https://nodejs.org/) v10+ to run.

Install the dependencies and devDependencies and start the server.

```sh
node app
yarn install
```
Change host at .env to run (I have used my wifi host to run and using mobile app to test wallet and check transaction history)

Build and Run system
```sh
yarn dev
node index.js
```

## API
GET
```sh
Get blockchain
http://hostname:8080/api/v1/blocks
Get peers
http://hostname:8080/api/v1/peers
```
POST
```sh
Create wallet
http://hostname:8080/api/v1/wallet
Login
http://hostname:8080/api/v1/auth
Send transaction
http://hostname:8080/api/v1/transaction
Add new peer
http://hostname:8080/api/v1/peers
```
## References
https://lhartikk.github.io/