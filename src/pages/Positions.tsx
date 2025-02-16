import { useState } from 'react';
import { mockPositions, mockCandidates, type Position, type Candidate } from '../lib/mockData';

export default function Positions() {
  const [positions] = useState<Position[]>(mockPositions);
  const [candidates] = useState<Candidate[]>(mockCandidates);
  const [votedPositions, setVotedPositions] = useState<Set<string>>(new Set());
  const [voting, setVoting] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  const getCandidatesForPosition = (positionId: string) => {
    return candidates.filter(c => c.position_id === positionId);
  };

  const handleVote = async (positionId: string, candidateId: string) => {
    try {
      setVoting(prev => ({ ...prev, [positionId]: true }));
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Add position to voted positions
      setVotedPositions(prev => new Set([...prev, positionId]));
      
      // Show success message
      setError('Vote cast successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVoting(prev => ({ ...prev, [positionId]: false }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Cast Your Vote</h1>

      {error && (
        <div className={`p-4 rounded-lg mb-6 ${
          error === 'Vote cast successfully!' 
            ? 'bg-green-50 text-green-600' 
            : 'bg-red-50 text-red-600'
        }`}>
          {error}
        </div>
      )}

      {positions.map(position => (
        <div key={position.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {position.title}
          </h2>
          {position.description && (
            <p className="text-gray-600 mb-6">{position.description}</p>
          )}

          {!votedPositions.has(position.id) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getCandidatesForPosition(position.id).map(candidate => (
                <div key={candidate.id} className="border rounded-lg p-4">
                  {candidate.photo_url && (
                    <img
                      src={candidate.photo_url}
                      alt={candidate.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-xl font-semibold mb-2">{candidate.name}</h3>
                  {candidate.manifesto && (
                    <p className="text-gray-600 mb-4">{candidate.manifesto}</p>
                  )}
                  <button
                    onClick={() => handleVote(position.id, candidate.id)}
                    disabled={voting[position.id]}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {voting[position.id] ? 'Voting...' : 'Vote'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              You have already voted for this position.
            </p>
          )}
        </div>
      ))}

      {positions.length === 0 && (
        <div className="text-center text-gray-600">
          No positions are currently available for voting.
        </div>
      )}
    </div>
  );
}