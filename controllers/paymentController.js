const { response } = require("express");
const paymentSession = require("ssl-commerz-node").PaymentSession;
const { Order } = require("../models/Order");
const { Payment } = require("../models/Payment");
const fetch = require("node-fetch");
const path = require("path");

// Request a Session
// Payment Process
// Receive IPN
// Create an Order 

module.exports.ipn = async (req, res) => {
    const payment = new Payment(req.body);
    const tran_id = payment['tran_id'];
    if (payment['status'] === 'VALID') {
        const order = await Order.updateOne({ transactionId: tran_id }, { status: 'Paid according to users' });
    } else {
        await Order.deleteOne({ transaction_id: tran_id });
    }
    await payment.save();
    if (payment["status"] === "VALID") {
        const val_id = payment['val_id']
        // const payData = {
        //     val_id: val_id,
        //     store_id: process.env.STORE_ID,
        //     store_passwrod: process.env.STORE_PASSWORD
        // }
        // for (key in payData) {
        //     formData.append(key, payData[key])
        // }
        const url = 
        `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${process.env.STORE_ID}&store_passwd=${process.env.STORE_PASSWORD}`
        fetch(url)
        .then(res => res.json())
        .then(async (data) => {
            if (data["status"] === "VALID" || "VALIDATED") {
                Order.updateOne({ transaction_id: tran_id }, { validatePayment: true })
                await Purchase.updateOne({ transaction_id: tran_id }, { validatePayment: true })  
                return res.status(200).send({
                    message: "Validation complete!",
                    data: data
                });
            } else if (data["status"] === "INVALID_TRANSACTION") {
                return res.status(404).send({
                    message: "Validation incomplete!"
                })
            }
        })
        .catch(err => {
            console.log("Validation error! ", err)
            return res.status(200).send("IPN Incomplete!");
        })
    } else {
        return res.status(200).send("IPN Unsuccessful!");
    }


}

module.exports.initPayment = async (req, res) => {
    const userId = req.user._id;
    const orderId = req.query.oid;
    const order = await Order.findOne({ userId: userId, _id: orderId });

    const { customer, price, ingredients } = order;

    const total_amount = price

    const total_item = ingredients.map(item => item.amount).reduce((a, b) => a + b, 0)

    const tran_id = '_' + Math.random().toString(36).substr(2, 9) + (new Date()).getTime();

    const payment = new PaymentSession(true, process.env.STORE_ID, process.env.STORE_PASSWORD);

    // Set the urls
    payment.setUrls({
        success: 'https://secret-stream-23319.herokuapp.com/api/payment/success', // If payment Succeed
        fail: 'yoursite.com/fail', // If payment failed
        cancel: 'yoursite.com/cancel', // If user cancel payment
        ipn: 'https://secret-stream-23319.herokuapp.com/api/payment/ipn' // SSLCommerz will send http post request in this link
    });

    // Set order details
    payment.setOrderInfo({
        total_amount: total_amount, // Number field
        currency: 'BDT', // Must be three character string
        tran_id: tran_id, // Unique Transaction id 
        emi_option: 0, // 1 or 0
    });

    // Set customer info
    payment.setCusInfo({
        name: req.user.email,
        email: req.user.email,
        add1: customer.deliveryAddress,
        add2: customer.deliveryAddress,
        city: customer.city,
        state: "",
        postcode: "",
        country: "BD",
        phone: customer.phone,
        fax: ""
    });

    // Set shipping info
    payment.setShippingInfo({
        method: 'Courier', //Shipping method of the order. Example: YES or NO or Courier
        num_item: total_item,
        name: req.user.name,
        add1: customer.deliveryAddress,
        add2: customer.deliveryAddress,
        city: customer.city,
        state: "",
        postcode: "",
        country: "BD",
    });

    // Set Product Profile
    payment.setProductInfo({
        product_name: 'Burger',
        product_category: 'Food',
        product_profile: 'food'
    });

    response = await payment.paymentInit();

    if (response.status === "SUCCESS") {
        await Order.updateOne({ _id: orderId }, { sessionKey: response["sessionKey"], transactionId: tran_id })
    }

    return res.status(200).send(response);
}

module.exports.paymentSuccess = (req, res) => {
    res.sendFile(path.join(__basedir + "/public/success.html"))
}