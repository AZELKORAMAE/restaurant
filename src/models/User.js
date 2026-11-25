import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['manager', 'superadmin'], default: 'manager' },
    // pending -> approved | rejected ; approved <-> suspended
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
