import { itemRoutes } from '@/lib/crud';
import Table from '@/models/Table';

export const { PATCH, DELETE } = itemRoutes(Table);
