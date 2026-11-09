// "/api" goes through the Vite dev proxy (see vite.config.ts). In production,
// VITE_API_URL must point to the public API, e.g. https://api.example.com/api.
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
