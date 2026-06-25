const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        qty: Number,
        img: String
    }],
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        name: String,
        phone: String,
        address: String,
        city: String,
        pinCode: String
    },
    paymentMethod: { type: String, enum: ['cod', 'upi', 'card', 'netbanking'], default: 'cod' },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
    review: {
        rating: { type: Number, min: 1, max: 5 },
        text: { type: String, trim: true, default: '' },
        images: [{ type: String }],
        reviewedAt: Date,
        isPublic: { type: Boolean, default: false }
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
