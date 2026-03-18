import { defineConfig } from 'orval';

const input = {
  target: '../../openapi.json',
  validation: true,
} as const;

const mutator = {
  path: './src/mutator/axios-instance.ts',
  name: 'axiosInstance',
} as const;

export default defineConfig({
  endpoints: {
    input,
    output: {
      mode: 'tags-split',
      target: './src/endpoints/index.ts',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
      indexFiles: true,
      override: {
        mutator,
        query: {
          useQuery: true,
          useMutation: true,
          version: 5,
        },
      },
    },
  },
  schemas: {
    input,
    output: {
      mode: 'tags-split',
      target: './src/schemas/index.ts',
      client: 'zod',
      clean: true,
      indexFiles: true,
    },
  },
  mocks: {
    input,
    output: {
      mode: 'tags-split',
      target: './src/mocks/index.ts',
      client: 'axios',
      httpClient: 'axios',
      clean: true,
      indexFiles: true,
      mock: {
        type: 'msw',
        indexMockFiles: true,
      },
    },
  },
});
