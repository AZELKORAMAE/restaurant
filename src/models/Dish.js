import mongoose from 'mongoose';

const Model3DSchema = new mongoose.Schema({
    // "none" | "processing" (automatic reconstruction running) | "ready" | "failed"
    status: { type: String, enum: ['none', 'processing', 'ready', 'failed'], default: 'none' },
    // "scan" = real scan (photogrammetry or imported scanning-app file), "ai" = AI reconstruction,
    // "plate" = quick preview generated from the dish photo
    source: { type: String, enum: ['scan', 'ai', 'plate', null], default: null },
    provider: { type: String, enum: ['kiri', 'meshy', null], default: null },
    glb: String,          // processed model shown to customers (real size, cleaned, optimised)
    originalGlb: String,  // untouched source, so the studio can always start over
    usdz: String,         // optional, iOS Quick Look (model-viewer generates one from the GLB otherwise)
    poster: String,       // rendered preview shown while the model loads
    captureImages: [String], // photos taken around the dish with the guided capture
    realDiameterCm: { type: Number, default: 26 },
    // Studio settings used to produce `glb` from `originalGlb`
    reference: {
        axis: { type: String, enum: ['width', 'height', 'keep'], default: 'width' },
        cm: Number,
    },
    rotation: { type: [Number], default: undefined },
    crop: { radiusCm: Number, bottomCm: Number, topCm: Number },
    quality: { type: String, enum: ['light', 'balanced', 'ultra'], default: 'balanced' },
    dimensions: { widthCm: Number, depthCm: Number, heightCm: Number },
    triangles: Number,
    taskId: String,
    progress: Number,
    error: String,
    updatedAt: Date,
}, { _id: false });

const DishSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', index: true },
    name: {
        type: String,
        required: [true, 'Please provide a name for this dish.'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description.'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide a base price.'],
    },
    image: {
        type: String,
        required: [true, 'Please provide an image URL.'],
    },
    images: [String], // additional gallery photos
    collection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
    },
    sizes: [
        {
            name: String,
            price: Number,
        },
    ],
    supplements: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplement'
        }
    ],
    prepTime: { type: Number, min: 0 }, // minutes
    ingredients: [
        {
            _id: false,
            name: String,
            quantity: String,
        },
    ],
    allergens: [String],
    tags: [String], // végétarien, épicé, signature…
    calories: Number,
    model3d: { type: Model3DSchema, default: () => ({}) },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true, suppressReservedKeysWarning: true });

// Avoid model recompilation error in Next.js development
if (mongoose.models && mongoose.models.Dish) {
    delete mongoose.models.Dish;
}

const Dish = mongoose.model('Dish', DishSchema);
export default Dish;
