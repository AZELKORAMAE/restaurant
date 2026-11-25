import { itemRoutes } from '@/lib/crud';
import Supplement from '@/models/Supplement';

export const { PATCH, DELETE } = itemRoutes(Supplement);
