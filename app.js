const express = require("express")
const app = express()

require("./middlewares")(app)
require("./middlewares/routes")(app)

module.exports = app