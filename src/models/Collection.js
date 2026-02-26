import mongoose from 'mongoose';

const CollectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for this collection.'],
        unique: true
    },
    description: String,
    image: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);
