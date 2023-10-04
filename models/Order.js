const { Schema, model } = require('mongoose');

const orderSchema = Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    ingredients: [{ type: {type: String}, amount: Number }],
    customer: {
        deliveryAddress: String,
        city: String,
        phone: Number,
        paymentType: String,
    },
    price: Number,
    status: { 
        type: String, 
        default: "Pending",
        enum: ["Pending", "Cash on delivery", "Paid according to users"] 
    },
    orderTime: { type: Date, default: Date.now() },
    sessionKey: { type: String, default: "" },
    transactionId: { 
        type: String, 
        default: "", 
    },
    validatePayment: { type: Boolean, default: false }
})

module.exports.Order = model("Order", orderSchema);