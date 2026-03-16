import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  rootDir: '.',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '<rootDir>/design-system/**/*.test.tsx',
    '<rootDir>/src/features/auth/schemas/**/*.test.ts',
    '<rootDir>/src/features/products/schemas/**/*.test.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/storybook-static/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@findog/api-client$': '<rootDir>/../api-client/src/index.ts',
    '^@findog/api-client/(.*)$': '<rootDir>/../api-client/src/$1',
    '^@findog/design-system$': '<rootDir>/design-system/index.ts',
    '^@findog/design-system/(.*)$': '<rootDir>/design-system/$1',
  },
};

export default createJestConfig(config);
