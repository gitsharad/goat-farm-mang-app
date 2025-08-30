import { useState, useEffect, useCallback } from 'react';

export function useAsyncData(fetchFn, { autoFetch = true, initialData = null } = {}) {
  const [state, setState] = useState({
    data: initialData,
    loading: autoFetch,
    error: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      console.group('useAsyncData');
      console.log('Fetching data...');
      
      const result = await fetchFn();
      console.log('Raw result:', result);
      
      // Handle different response structures
      let data = result;
      
      if (result) {
        // Case 1: Direct array response
        if (Array.isArray(result)) {
          console.log('Received direct array response');
          data = result;
        }
        // Case 2: Response with data/items property
        else if (result.data && Array.isArray(result.data)) {
          console.log('Found data array in response.data');
          data = result.data;
        }
        // Case 3: Response with goats property (specific to goats API)
        else if (result.goats && Array.isArray(result.goats)) {
          console.log('Found goats array in response.goats');
          data = result.goats;
        }
        // Case 4: Response with items property (common pagination pattern)
        else if (result.items && Array.isArray(result.items)) {
          console.log('Found items array in response.items');
          data = result.items;
        }
        // Case 5: Single object response
        else if (typeof result === 'object' && !Array.isArray(result)) {
          console.log('Received single object response');
          data = result;
        }
      }
      
      console.log('Processed data:', data);
      
      setState({
        data,
        loading: false,
        error: null,
      });
      
      console.groupEnd();
      return data;
    } catch (error) {
      console.error('Error in useAsyncData:', error);
      setState({
        data: initialData,
        loading: false,
        error: error.message || 'Failed to fetch data',
      });
      throw error;
    }
  }, [fetchFn, initialData]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  const { data, loading, error } = state;

  return {
    data,
    loading,
    error,
    fetchData, // Allow manual refetching
    setData: (newData) => setState(prev => ({ ...prev, data: newData })),
  };
}

export function usePaginatedData(fetchFn, { pageSize = 10, ...options } = {}) {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const { data, loading, error, fetchData, ...rest } = useAsyncData(
    async () => {
      const result = await fetchFn({ page, pageSize });
      setTotal(result.total || result.data?.length || 0);
      return result.data || result;
    },
    { ...options, autoFetch: false }
  );

  const [localPageSize, setLocalPageSize] = useState(pageSize);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchData();
    }
  }, [page, localPageSize, fetchData, options.autoFetch]);

  const handleSetPageSize = useCallback((size) => {
    setPage(1);
    setLocalPageSize(size);
  }, []);

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    setPage,
    setPageSize: handleSetPageSize,
    ...rest,
  };
}
