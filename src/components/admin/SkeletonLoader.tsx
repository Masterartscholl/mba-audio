import React from 'react';

export const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4">
        <div className="h-12 bg-[#1e293b] rounded-xl w-full"></div>
        <div className="h-12 bg-[#1e293b] rounded-xl w-full"></div>
        <div className="h-48 bg-[#1e293b] rounded-xl w-full"></div>
    </div>
);
