import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Query keys
export const QUERY_KEYS = {
  GOATS: 'goats',
  HEALTH_RECORDS: 'healthRecords',
  BREEDING_RECORDS: 'breedingRecords',
};
