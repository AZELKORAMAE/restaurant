import { handler, ok, requireSuperAdmin, HttpError } from '@/lib/api';
import { getBucket } from '@/lib/gridfs';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import Payment from '@/models/Payment';
import Dish from '@/models/Dish';
import Collection from '@/models/Collection';
import Supplement from '@/models/Supplement';
import Table from '@/models/Table';
import Order from '@/models/Order';
import Expense from '@/models/Expense';
import Media from '@/models/Media';
import UploadChunk from '@/models/UploadChunk';

/**
 * Platform reset (super-admin only). The super-admin account itself is not stored in the
 * database (ADMIN_EMAIL / ADMIN_PASSWORD) and the platform settings are always kept.
 */
const GROUPS = {
    accounts: { label: 'Comptes gérants, restaurants et paiements', models: { Comptes: User, Restaurants: Restaurant, Paiements: Payment } },
    menu: { label: 'Plats, catégories et suppléments', models: { Plats: Dish, Catégories: Collection, Suppléments: Supplement } },
    activity: { label: 'Tables, commandes et dépenses', models: { Tables: Table, Commandes: Order, Dépenses: Expense } },
};

async function fileCount() {
    const bucket = await getBucket();
    const [gridfs, legacy] = await Promise.all([bucket.find({}).toArray().then((l) => l.length), Media.countDocuments()]);
    return gridfs + legacy;
}

export const GET = handler(async () => {
    await requireSuperAdmin();
    const groups = {};
    for (const [key, g] of Object.entries(GROUPS)) {
        const counts = {};
        for (const [name, Model] of Object.entries(g.models)) counts[name] = await Model.countDocuments();
        groups[key] = { label: g.label, counts };
    }
    groups.files = { label: 'Images et modèles 3D', counts: { Fichiers: await fileCount() } };
    return ok(groups);
});

export const POST = handler(async (request) => {
    await requireSuperAdmin();
    const { confirm, scope = {} } = await request.json();
    if (confirm !== 'SUPPRIMER') throw new HttpError(400, 'Tapez SUPPRIMER pour confirmer.');
    const deleted = {};
    for (const [key, g] of Object.entries(GROUPS)) {
        if (!scope[key]) continue;
        for (const [name, Model] of Object.entries(g.models)) deleted[name] = (await Model.deleteMany({})).deletedCount;
    }
    if (scope.files) {
        deleted.Fichiers = await fileCount();
        const bucket = await getBucket();
        await bucket.drop().catch(() => {}); // empty bucket: nothing to drop
        await Media.deleteMany({});
        await UploadChunk.deleteMany({});
    }
    if (!Object.keys(deleted).length) throw new HttpError(400, 'Choisissez au moins un élément à effacer.');
    return ok({ deleted });
});
