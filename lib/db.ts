import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../drizzle/schema';

const client = createClient({
  url: 'file:local.db',
});

export const db = drizzle(client, { schema });
