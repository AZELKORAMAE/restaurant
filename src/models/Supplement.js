import mongoose from 'mongoose';

const SupplementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for this supplement.'],
        unique: true
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price.']
    },
    image: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.models.Supplement || mongoose.model('Supplement', SupplementSchema);
