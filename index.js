require("dotenv").config();
const express = require("express");
const app = express();

const db = require("./public/database");
const routes = require('./public/routes')

app.use(express.json());
app.use("/ssu/api",routes)

app.listen(3000, () => console.log("SSU API - Up and running!"));
