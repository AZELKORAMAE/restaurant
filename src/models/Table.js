import mongoose from 'mongoose';

const TableSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', index: true },
    number: {
        type: String,
        required: true,
    },
    capacity: {
        type: Number,
        default: 4,
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'reserved'],
        default: 'available',
    }
}, { timestamps: true });

TableSchema.index({ restaurant: 1, number: 1 }, { unique: true });

export default mongoose.models.Table || mongoose.model('Table', TableSchema);
