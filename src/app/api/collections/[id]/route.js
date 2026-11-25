import { itemRoutes } from '@/lib/crud';
import Collection from '@/models/Collection';

export const { PATCH, DELETE } = itemRoutes(Collection);
