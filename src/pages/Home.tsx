import React from 'react';
import { Link } from 'react-router-dom';
import { Vote } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <Vote className="h-20 w-20 mx-auto text-blue-600 mb-8" />
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to KCA Voting System
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Exercise your right to vote and shape the future of your institution.
      </p>
      <div className="flex justify-center space-x-4">
        <Link
          to="/positions"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Vote Now
        </Link>
        <Link
          to="/results"
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
        >
          View Results
        </Link>
      </div>
    </div>
  );
}