import { listRoutes } from '@/lib/crud';
import Collection from '@/models/Collection';

export const { GET, POST } = listRoutes(Collection, { sort: { name: 1 } });
