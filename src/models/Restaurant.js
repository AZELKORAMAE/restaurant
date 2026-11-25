import mongoose from 'mongoose';

const RestaurantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, maxlength: 600 },
    cuisine: { type: String, maxlength: 60 },
    address: String,
    city: String,
    phone: String,
    logo: String,
    coverImage: String,
    currency: { type: String, default: 'DH' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Mirrors the owner's account: only "approved" restaurants are public.
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
    reviewNote: String,
    reviewedAt: Date,
    acceptsOrders: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);
