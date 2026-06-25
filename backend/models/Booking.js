const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', default: null },
    workerName: String,
    workerRole: String,
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerLocation: { type: String, required: true },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    description: String,
    status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], default: 'Pending' },
    review: {
        rating: { type: Number, min: 1, max: 5 },
        text: { type: String, trim: true, default: '' },
        images: [{ type: String }],
        reviewedAt: Date,
        isPublic: { type: Boolean, default: false }
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
