import { itemRoutes } from '@/lib/crud';
import Order from '@/models/Order';

export const { PATCH } = itemRoutes(Order, { updatable: ['status'] });
