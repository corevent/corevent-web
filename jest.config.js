// Jest runs the unit tests (pure logic) and the Supertest HTTP tests of the built site.
// Integration tests (React + MSW) run in Vitest and E2E tests in Cypress.
// TypeScript is compiled by Babel with inline options so the Vite build is not affected;
// `import.meta.env` (Vite-only syntax) is rewritten to `process.env` for Node.
const babelTransform = [
  'babel-jest',
  {
    configFile: false,
    babelrc: false,
    presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
    plugins: ['babel-plugin-transform-vite-meta-env'],
  },
]

/** @type {import('jest').Config} */
export default {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      setupFiles: ['<rootDir>/tests/unit/setup-env.ts'],
      transform: { '^.+\\.[jt]sx?$': babelTransform },
    },
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/api/**/*.test.ts'],
      globalSetup: '<rootDir>/tests/api/global-setup.ts',
      globalTeardown: '<rootDir>/tests/api/global-teardown.ts',
      transform: { '^.+\\.[jt]sx?$': babelTransform },
    },
  ],
  coverageProvider: 'v8',
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/main.tsx', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text-summary', 'html', 'json'],
}
