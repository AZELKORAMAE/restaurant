import mongoose from 'mongoose';

const DishSchema = new mongoose.Schema({
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
    collection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
        required: [true, 'Please provide a collection.'],
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
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// Avoid model recompilation error in Next.js development
// If we are here, we want the NEWEST schema
if (mongoose.models && mongoose.models.Dish) {
    delete mongoose.models.Dish;
}

const Dish = mongoose.model('Dish', DishSchema);
export default Dish;
