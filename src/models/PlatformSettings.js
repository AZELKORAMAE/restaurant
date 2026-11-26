import mongoose from 'mongoose';

// Single document (key "platform") holding what the super-admin can configure.
const PlatformSettingsSchema = new mongoose.Schema({
    key: { type: String, default: 'platform', unique: true },
    trialDays: { type: Number, default: 14 },
    graceDays: { type: Number, default: 5 },
    reminderDays: { type: Number, default: 7 },
    defaultPlan: { type: String, default: 'pro' },
    currency: { type: String, default: 'DH' },
    prices: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    paymentInstructions: { type: String, default: '' },
    contactPhone: String,
    contactEmail: String,
    countryCode: { type: String, default: '212' }, // used to build WhatsApp links from local numbers
}, { timestamps: true, minimize: false });

export default mongoose.models.PlatformSettings || mongoose.model('PlatformSettings', PlatformSettingsSchema);
