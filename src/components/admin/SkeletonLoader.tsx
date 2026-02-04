import React from 'react';

export const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4">
        <div className="h-12 bg-admin-border/50 rounded-xl w-full"></div>
        <div className="h-12 bg-admin-border/50 rounded-xl w-full"></div>
        <div className="h-48 bg-admin-border/50 rounded-xl w-full"></div>
    </div>
);
