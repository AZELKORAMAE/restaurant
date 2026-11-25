import { listRoutes } from '@/lib/crud';
import Table from '@/models/Table';

export const { GET, POST } = listRoutes(Table, { sort: { number: 1 } });
