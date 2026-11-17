import { join } from 'node:path'

/** Port used by the preview server of the built site during the Supertest suite. */
export const PREVIEW_PORT = 4175
export const BASE_URL = `http://localhost:${PREVIEW_PORT}`

/** Production build used by the tests (kept out of `dist/` so it never mixes with a real build). */
export const BUILD_DIR = join(process.cwd(), 'node_modules', '.tmp', 'supertest-dist')
