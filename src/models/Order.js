import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    items: [
        {
            dish: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Dish',
                required: true,
            },
            name: String,
            quantity: {
                type: Number,
                required: true,
                min: [1, 'Quantity cannot be less than 1.'],
            },
            size: {
                name: String,
                price: Number,
            },
            supplements: [
                {
                    name: String,
                    price: Number,
                },
            ],
            price: Number,
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
        default: 'pending',
    },
    customerInfo: {
        name: String,
        address: String,
        phone: String,
        email: String,
    },
    tableNumber: {
        type: String,
        default: null,
    },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
