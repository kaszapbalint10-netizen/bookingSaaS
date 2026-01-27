import React from 'react';
import { motion } from 'framer-motion';
import './Skeleton.css';

const Skeleton = ({
  width = '100%',
  height = '16px',
  borderRadius = '8px',
  className = '',
  count = 1,
}) => {
  const skeletons = Array(count).fill(null);

  return (
    <>
      {skeletons.map((_, index) => (
        <motion.div
          key={index}
          className={`skeleton ${className}`}
          style={{
            width,
            height,
            borderRadius,
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      ))}
    </>
  );
};

export const CardSkeleton = () => (
  <div className="card-skeleton">
    <Skeleton width="100%" height="150px" borderRadius="12px" />
    <div className="skeleton-content">
      <Skeleton width="70%" height="20px" />
      <Skeleton width="100%" height="16px" />
      <Skeleton width="60%" height="16px" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <div className="table-row-skeleton">
    <Skeleton width="40px" height="40px" borderRadius="8px" />
    <Skeleton width="120px" height="20px" />
    <Skeleton width="100px" height="20px" />
    <Skeleton width="80px" height="20px" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="dashboard-skeleton">
    <div className="skeleton-header">
      <Skeleton width="200px" height="32px" />
    </div>
    <div className="skeleton-grid">
      {Array(4)
        .fill(null)
        .map((_, i) => (
          <CardSkeleton key={i} />
        ))}
    </div>
    <div className="skeleton-content">
      <Skeleton width="100%" height="300px" borderRadius="12px" />
    </div>
  </div>
);

export const ListSkeleton = ({ count = 5 }) => (
  <div className="list-skeleton">
    {Array(count)
      .fill(null)
      .map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
  </div>
);

export default Skeleton;
