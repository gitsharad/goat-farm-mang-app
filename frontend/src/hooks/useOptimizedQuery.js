import { useQuery, useQueryClient } from '@tanstack/react-query';
import { performanceConfig } from '../config/performance';
import { useCallback, useEffect } from 'react';

export const useOptimizedQuery = (key, queryFn, options = {}) => {
  const queryClient = useQueryClient();
  
  // Default options merged with performance config
  const queryOptions = {
    retry: performanceConfig.api.retry,
    retryDelay: performanceConfig.api.retryDelay,
    staleTime: performanceConfig.api.staleTime,
    cacheTime: performanceConfig.api.cacheTime,
    refetchOnWindowFocus: false,
    ...options,
  };

  // Prefetch related data
  const prefetchRelatedData = useCallback(async () => {
    if (options.prefetchRelated) {
      await Promise.all(
        options.prefetchRelated.map(({ key, queryFn }) =>
          queryClient.prefetchQuery(key, queryFn, {
            staleTime: performanceConfig.api.staleTime,
          })
        )
      );
    }
  }, [options.prefetchRelated, queryClient]);

  // Prefetch on component mount
  useEffect(() => {
    if (options.prefetchOnMount) {
      prefetchRelatedData();
    }
  }, [prefetchRelatedData, options.prefetchOnMount]);

  // Use React Query's useQuery with our optimized defaults
  return useQuery(key, queryFn, queryOptions);
};

// Optimized mutation hook with retry and error handling
export const useOptimizedMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation(mutationFn, {
    onError: (error) => {
      console.error('Mutation error:', error);
      // You can add error reporting here (e.g., Sentry, LogRocket)
    },
    onSettled: () => {
      // Invalidate and refetch
      if (options.invalidateQueries) {
        queryClient.invalidateQueries(options.invalidateQueries);
      }
    },
    ...options,
  });
};

// Cache invalidation utilities
export const useCacheUtils = () => {
  const queryClient = useQueryClient();
  
  const invalidateQueries = useCallback((queryKey) => {
    queryClient.invalidateQueries(queryKey);
  }, [queryClient]);
  
  const cancelQueries = useCallback((queryKey) => {
    queryClient.cancelQueries(queryKey);
  }, [queryClient]);
  
  const getQueryData = useCallback((queryKey) => {
    return queryClient.getQueryData(queryKey);
  }, [queryClient]);
  
  return {
    invalidateQueries,
    cancelQueries,
    getQueryData,
  };
};
