const connection = require("./connection");
const knex = require("knex")(connection.development);

module.exports = knex;
