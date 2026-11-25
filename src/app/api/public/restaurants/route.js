import { handler, ok } from '@/lib/api';
import Restaurant from '@/models/Restaurant';

// Public directory of approved restaurants (landing page).
export const GET = handler(async () => {
    const list = await Restaurant.find({ status: 'approved' })
        .select('name slug cuisine city logo coverImage description')
        .sort({ createdAt: -1 }).limit(60);
    return ok(list);
});
