import { listRoutes } from '@/lib/crud';
import Expense from '@/models/Expense';

export const { GET, POST } = listRoutes(Expense, { sort: { date: -1 } });
