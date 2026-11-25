import mongoose from 'mongoose';

const CollectionSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', index: true },
    name: {
        type: String,
        required: [true, 'Please provide a name for this collection.'],
    },
    description: String,
    image: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Names are unique per restaurant (was globally unique before multi-restaurant).
CollectionSchema.index({ restaurant: 1, name: 1 }, { unique: true });

export default mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);
