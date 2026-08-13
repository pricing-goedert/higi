import path from 'node:path'
import dotenv from 'dotenv'

// Backend has no .env of its own — it reads the single root-level .env
// (higi/.env) that docker-compose.yml also uses. Both `src` (dev, via tsx)
// and `dist` (prod build) sit two directories under the repo root, so this
// path resolves correctly either way. In Docker no .env file is present at
// all (Render/docker-compose inject env vars directly), so this silently
// no-ops there instead of throwing.
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
