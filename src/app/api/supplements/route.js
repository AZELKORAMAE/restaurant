import { listRoutes } from '@/lib/crud';
import Supplement from '@/models/Supplement';

export const { GET, POST } = listRoutes(Supplement, { sort: { name: 1 } });
