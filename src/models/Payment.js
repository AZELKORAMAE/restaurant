import mongoose from 'mongoose';

// A subscription payment: declared by the manager (pending) or recorded by the super-admin.
const PaymentSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    plan: { type: String, required: true },
    months: { type: Number, required: true, min: 0 },
    days: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'DH' },
    method: { type: String, enum: ['virement', 'especes', 'cheque', 'carte', 'offert', 'autre'], default: 'virement' },
    reference: String,
    receiptUrl: String,
    status: { type: String, enum: ['pending', 'validated', 'rejected'], default: 'pending', index: true },
    note: String,
    declaredBy: { type: String, enum: ['manager', 'admin'], default: 'manager' },
    periodStart: Date,
    periodEnd: Date,
    validatedAt: Date,
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
