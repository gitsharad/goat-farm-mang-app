import React from 'react';

export const SkeletonCard = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}>
    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
  </div>
);

export const SkeletonStatCard = () => (
  <div className="p-4 bg-white rounded-lg shadow">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div className="h-8 bg-gray-200 rounded w-64"></div>
      <div className="h-10 bg-gray-200 rounded w-32"></div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((item) => (
        <SkeletonStatCard key={item} />
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((item) => (
            <SkeletonCard key={item} className="h-16" />
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <SkeletonCard key={item} className="h-24" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default DashboardSkeleton;
