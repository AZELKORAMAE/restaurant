import mongoose from 'mongoose';

const SupplementSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', index: true },
    name: {
        type: String,
        required: [true, 'Please provide a name for this supplement.'],
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

SupplementSchema.index({ restaurant: 1, name: 1 }, { unique: true });

export default mongoose.models.Supplement || mongoose.model('Supplement', SupplementSchema);
