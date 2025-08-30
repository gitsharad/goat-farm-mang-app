import React from 'react';
import { useParams } from 'react-router-dom';

const UserDetail = () => {
  const { id } = useParams();
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">User Details</h2>
      <p>Details for user ID: {id}</p>
    </div>
  );
};

export default UserDetail;
