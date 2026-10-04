// src/components/Dashboard.js
import React from 'react';

const Dashboard = () => {
  return (
    <div className="h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold mb-4">Dashboard</h1>
        <div className="flex flex-wrap">
          <div className="w-full md:w-1/2 lg:w-1/4 bg-blue-200 p-4 rounded-lg shadow-md mb-4 md:mr-4">Widget 1</div>
          <div className="w-full md:w-1/2 lg:w-1/4 bg-green-200 p-4 rounded-lg shadow-md mb-4 md:mr-4">Widget 2</div>
          <div className="w-full md:w-1/2 lg:w-1/4 bg-yellow-200 p-4 rounded-lg shadow-md mb-4 md:mr-4">Widget 3</div>
          <div className="w-full md:w-1/2 lg:w-1/4 bg-pink-200 p-4 rounded-lg shadow-md mb-4">Widget 4</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
