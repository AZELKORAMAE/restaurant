import { handler, ok, requireSuperAdmin } from '@/lib/api';
import Payment from '@/models/Payment';
import '@/models/Restaurant';

export const GET = handler(async (request) => {
    await requireSuperAdmin();
    const status = new URL(request.url).searchParams.get('status');
    const query = ['pending', 'validated', 'rejected'].includes(status) ? { status } : {};
    return ok(await Payment.find(query).sort({ createdAt: -1 }).limit(200).populate('restaurant', 'name slug plan'));
});
