const { Order } = require("../models/Order")

module.exports.createOrder = async (req, res) => {
    const order = new Order(req.body)
    try {
        await order.save()
        return res.status(201).send({
            msg: "Order placed successfully!",
            order: order
        })
    } catch (err) {
        return res.status(400).send("Somwthing wrong!")
    }
}

module.exports.getOrders = async (req, res) => {
    const orders = await Order.find({userId: req.user._id}).sort({orderTime: -1}) // -1 is desc order
    res.status(200).send(orders)
}