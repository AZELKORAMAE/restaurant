import { handler, ok, requireManager, findPublicRestaurant, HttpError } from '@/lib/api';
import Order from '@/models/Order';
import Dish from '@/models/Dish';
import Supplement from '@/models/Supplement';
import Table from '@/models/Table';

// Public: a customer places an order. Prices are recomputed from the database,
// never trusted from the browser.
export const POST = handler(async (request) => {
    const body = await request.json();
    const restaurant = await findPublicRestaurant(body.restaurant);
    if (!restaurant.acceptsOrders) throw new HttpError(403, 'Ce restaurant ne prend pas de commandes en ligne.');

    const rawItems = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
    if (!rawItems.length) throw new HttpError(400, 'Panier vide.');

    const dishIds = rawItems.map((i) => i.dish);
    const dishes = await Dish.find({ _id: { $in: dishIds }, restaurant: restaurant._id, isActive: true });
    const supplements = await Supplement.find({ restaurant: restaurant._id, isActive: true });

    const items = rawItems.map((raw) => {
        const dish = dishes.find((d) => d._id.equals(raw.dish));
        if (!dish) throw new HttpError(400, 'Un plat de votre panier n’est plus disponible.');
        const quantity = Math.max(1, Math.min(50, parseInt(raw.quantity, 10) || 1));
        const size = raw.size?.name ? dish.sizes.find((s) => s.name === raw.size.name) : null;
        const supIds = (raw.supplements || []).map((s) => String(s?._id || s));
        const sups = supplements.filter((s) => supIds.includes(s._id.toString())
            && dish.supplements.some((ds) => ds.equals(s._id)));
        const unit = dish.price + (size?.price || 0) + sups.reduce((t, s) => t + s.price, 0);
        return {
            dish: dish._id,
            name: dish.name,
            quantity,
            size: size ? { name: size.name, price: size.price } : undefined,
            supplements: sups.map((s) => ({ name: s.name, price: s.price })),
            price: Math.round(unit * quantity * 100) / 100,
        };
    });

    let tableNumber = body.tableNumber ? String(body.tableNumber).slice(0, 20) : null;
    if (tableNumber && !(await Table.exists({ restaurant: restaurant._id, number: tableNumber }))) tableNumber = null;

    const info = body.customerInfo || {};
    const customerInfo = {
        name: String(info.name || '').slice(0, 80),
        phone: String(info.phone || '').slice(0, 30),
        email: String(info.email || '').slice(0, 120),
        address: tableNumber ? `TABLE ${tableNumber}` : String(info.address || '').slice(0, 300),
    };
    if (!tableNumber && (!customerInfo.name || !customerInfo.phone || !customerInfo.address)) {
        throw new HttpError(400, 'Nom, téléphone et adresse requis.');
    }

    const order = await Order.create({
        restaurant: restaurant._id,
        items,
        totalAmount: Math.round(items.reduce((t, i) => t + i.price, 0) * 100) / 100,
        customerInfo,
        tableNumber,
    });
    return ok({ _id: order._id, totalAmount: order.totalAmount, status: order.status }, 201);
});

export const GET = handler(async () => {
    const { restaurantId } = await requireManager();
    return ok(await Order.find({ restaurant: restaurantId }).sort({ createdAt: -1 }).limit(1000));
});
