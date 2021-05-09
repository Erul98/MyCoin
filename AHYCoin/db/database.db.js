"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knex = void 0;
const knex = require('knex')({
    client: 'mysql2',
    connection: {
        host: '127.0.0.1',
        user: 'root',
        password: '00000000',
        database: 'ahycoin',
        port: 3306
    },
    //pool: { min: 0, max: 10 }
});
exports.knex = knex;
