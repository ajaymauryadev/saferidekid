import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

// Workspace scripts run from apps/api; the documented .env lives at the root.
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
