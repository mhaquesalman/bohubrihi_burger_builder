const router = require("express").Router();
const { createOrder, getOrders } = require("../controllers/orderController");
const authorize  = require('../middlewares/authorize')

router.route("/").get(authorize, getOrders).post(authorize, createOrder);

module.exports = router;