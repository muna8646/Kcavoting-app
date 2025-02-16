import { useState, useEffect } from 'react';
import { Vote, Eye, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Candidate {
    id: number;
    name: string;
    position: string;
    manifesto: string;
    image_url: string;
    voteCount?: number;
}

export function VoterDashboard() {
    const [showResults, setShowResults] = useState(false);
    const [votedFor, setVotedFor] = useState<number | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [voteSuccess, setVoteSuccess] = useState(false);
    const navigate = useNavigate();

    // Check user role on component mount
    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (role !== 'voter') {
            navigate('/'); // Redirect to login page if not a voter
        }
    }, [navigate]);

    // Fetch candidates from the server
    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const response = await fetch('http://localhost:5000/candidates', {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch candidates');
                }

                const data = await response.json();

                // Ensure image URLs are absolute (prepend server URL if necessary)
                const updatedCandidates = data.map((candidate: Candidate) => ({
                    ...candidate,
                    image_url: candidate.image_url.startsWith('http')
                        ? candidate.image_url
                        : `http://localhost:5000${candidate.image_url}`,
                }));

                setCandidates(updatedCandidates);
            } catch (error) {
                console.error('Error fetching candidates:', error);
                alert('Failed to load candidates. Please try again later.');
            }
        };

        fetchCandidates();
    }, []);

    const handleVote = async (candidateId: number) => {
        try {
            const response = await fetch(`http://localhost:5000/vote/${candidateId}`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to cast vote');
            }

            setVotedFor(candidateId);
            setVoteSuccess(true);

            // Update vote counts
            const updatedCandidates = candidates.map((candidate) =>
                candidate.id === candidateId
                    ? { ...candidate, voteCount: (candidate.voteCount || 0) + 1 }
                    : candidate
            );
            setCandidates(updatedCandidates);

            // Hide voting table after successful vote
            setTimeout(() => {
                setVoteSuccess(false);
            }, 3000);

            // Fetch updated candidates
            const fetchUpdatedCandidates = async () => {
                try {
                    const response = await fetch('http://localhost:5000/candidates', {
                        method: 'GET',
                        credentials: 'include', // Include cookies for session management
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch candidates');
                    }

                    const data = await response.json();

                    // Ensure image URLs are absolute (prepend server URL if necessary)
                    const updatedCandidates = data.map((candidate: Candidate) => ({
                        ...candidate,
                        image_url: candidate.image_url.startsWith('http')
                            ? candidate.image_url
                            : `http://localhost:5000${candidate.image_url}`,
                    }));

                    setCandidates(updatedCandidates); // Set the fetched candidates into state
                } catch (error) {
                    console.error('Error fetching candidates:', error);
                    alert('Failed to load candidates. Please try again later.');
                }
            };

            fetchUpdatedCandidates()
            setShowResults(true)
        } catch (error) {
            console.error('Error casting vote:', error);
            alert('Failed to cast vote. Please try again.');
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('http://localhost:5000/logout', {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                localStorage.removeItem('userRole');
                navigate('/');
            } else {
                console.error('Logout failed');
                alert('Failed to log out. Please try again.');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('An error occurred while logging out.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Voter Dashboard</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowResults(!showResults)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Eye className="mr-2 h-5 w-5" />
                            {showResults ? 'Hide Results' : 'View Results'}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <LogOut className="mr-2 h-5 w-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Success Message */}
                {voteSuccess && (
                    <div className="bg-green-200 text-green-800 p-3 rounded mb-4">
                        Vote cast successfully!
                    </div>
                )}

                {/* Candidates Section */}
                {!voteSuccess && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {candidates.map((candidate) => (
                            <div key={candidate.id} className="bg-white overflow-hidden shadow rounded-lg">
                                <img
                                    src={candidate.image_url}
                                    alt={candidate.name}
                                    className="w-full h-48 object-cover"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = '/fallback-image.jpg';
                                    }}
                                />
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-gray-900">{candidate.name}</h3>
                                    <p className="mt-1 text-sm text-gray-500">{candidate.position}</p>
                                    <p className="mt-3 text-sm text-gray-700">{candidate.manifesto}</p>
                                    <button
                                        onClick={() => handleVote(candidate.id)}
                                        disabled={votedFor !== null}
                                        className={`mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${votedFor === candidate.id
                                            ? 'bg-green-600'
                                            : votedFor !== null
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                    >
                                        <Vote className="mr-2 h-5 w-5" />
                                        {votedFor === candidate.id ? 'Voted' : 'Vote'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Results Section */}
                {showResults && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Election Results</h2>
                        {candidates.map((candidate) => (
                            <div key={candidate.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span>{candidate.name}</span>
                                <span className="font-medium text-blue-600">Votes: {candidate.voteCount || 0}</span>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
