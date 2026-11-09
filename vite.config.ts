import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // In production there is no dev proxy: a relative URL such as "/api" would hit the static
  // host (which answers index.html). Fail the build unless a same-origin rewrite is intended.
  if (command === 'build' && mode === 'production' && !/^https?:\/\//.test(env.VITE_API_URL ?? '')) {
    if (env.VITE_ALLOW_RELATIVE_API !== 'true') {
      throw new Error(
        `VITE_API_URL must be an absolute URL in production builds (got "${env.VITE_API_URL ?? ''}"). ` +
          'Set it in .env.production or in the CI environment, or set VITE_ALLOW_RELATIVE_API=true ' +
          'if /api is rewritten to the API on the same origin.',
      )
    }
  }

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    server: {
      // The API does not enable CORS, so in development requests to /api are
      // proxied to the backend and the browser only talks to the Vite origin.
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
