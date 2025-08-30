// Performance optimization configurations
export const performanceConfig = {
  // Image optimization
  image: {
    quality: 80,
    formats: ['image/webp'],
    breakpoints: [360, 640, 768, 1024, 1280, 1536],
    placeholder: 'blur',
  },
  
  // API request optimization
  api: {
    retry: 2,
    retryDelay: 1000,
    timeout: 10000, // 10 seconds
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  },
  
  // Code splitting
  codeSplitting: {
    // These components will be dynamically imported
    dynamicImports: [
      'DashboardCharts',
      'DataGrid',
      'ImageGallery',
      'PDFViewer'
    ]
  },
  
  // Service Worker configuration
  serviceWorker: {
    enabled: process.env.NODE_ENV === 'production',
    scope: '/',
    register: true,
    skipWaiting: true,
  }
};

// Web Vitals monitoring
export const reportWebVitals = (metric) => {
  if (process.env.NODE_ENV === 'production') {
    // Send metrics to your analytics service
    console.log(metric);
    // Example: analytics.send('web_vitals', metric);
  }
};

// Resource hints for critical resources
export const resourceHints = [
  { rel: 'preconnect', href: 'https://your-api-domain.com' },
  { rel: 'dns-prefetch', href: 'https://your-cdn-domain.com' },
];
