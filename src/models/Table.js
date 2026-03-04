import mongoose from 'mongoose';

const TableSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        unique: true,
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

export default mongoose.models.Table || mongoose.model('Table', TableSchema);
