import { itemRoutes } from '@/lib/crud';
import Expense from '@/models/Expense';

export const { DELETE } = itemRoutes(Expense);
