import React, { useState } from 'react';
import { mockPositions, mockCandidates } from '../lib/mockData';

interface CandidateResult {
  id: string;
  name: string;
  photo_url: string;
  vote_count: number;
}

export default function Results() {
  const [positions] = useState(mockPositions);
  const [candidates] = useState(mockCandidates);

  // Generate random vote counts for demonstration
  const getResults = (positionId: string): CandidateResult[] => {
    return candidates
      .filter(c => c.position_id === positionId)
      .map(c => ({
        id: c.id,
        name: c.name,
        photo_url: c.photo_url,
        vote_count: Math.floor(Math.random() * 100) // Random vote count for demo
      }))
      .sort((a, b) => b.vote_count - a.vote_count);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Election Results</h1>

      {positions.map(position => (
        <div key={position.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {position.title}
          </h2>

          <div className="space-y-4">
            {getResults(position.id).map((candidate, index) => {
              const maxVotes = Math.max(...getResults(position.id).map(c => c.vote_count));
              const percentage = (candidate.vote_count / maxVotes) * 100;

              return (
                <div
                  key={candidate.id}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                >
                  {candidate.photo_url && (
                    <img
                      src={candidate.photo_url}
                      alt={candidate.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">
                        {index === 0 && (
                          <span className="text-green-600 mr-2">👑 Leading</span>
                        )}
                        {candidate.name}
                      </h3>
                      <span className="font-semibold text-blue-600">
                        {candidate.vote_count} votes
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {positions.length === 0 && (
        <div className="text-center text-gray-600">
          No positions are available.
        </div>
      )}
    </div>
  );
}