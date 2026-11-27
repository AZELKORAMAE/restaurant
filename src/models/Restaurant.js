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
    // Position on the map (chosen on a map / from a Google Maps link) — shown on the restaurant's site
    location: {
        lat: Number,
        lng: Number,
        address: String,
        mapsUrl: String,
    },
    // Look of the restaurant's site
    theme: {
        accent: { type: String, default: '#FFC244' },
        overlay: { type: Number, default: 0.45 },   // darkness of the cover image (0 → 0.85)
        focalX: { type: Number, default: 50 },      // part of the cover image kept visible (%)
        focalY: { type: Number, default: 50 },
    },
    // Subscription
    plan: { type: String, enum: ['essentiel', 'pro', 'premium'], default: 'pro' },
    trialEndsAt: Date,
    paidUntil: Date,
    // Restrictions set by the super-admin (on top of the plan)
    restrictions: {
        readOnly: { type: Boolean, default: false },
        ordersDisabled: { type: Boolean, default: false },
        threeDDisabled: { type: Boolean, default: false },
        maxDishes: { type: Number, default: null },
        note: String,
    },
    accessSentAt: Date,
}, { timestamps: true });

export default mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);
