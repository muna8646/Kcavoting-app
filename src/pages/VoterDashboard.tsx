import React, { useState, useEffect } from 'react';
import { Vote, Eye, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Candidate {
    id: number;
    name: string;
    position: string;
    manifesto: string;
    image_url: string;
    voteCount: number;
}

export function VoterDashboard() {
    const [showResults, setShowResults] = useState(false);
    const [votesPerPosition, setVotesPerPosition] = useState<Record<number, boolean>>({});
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [voteSuccess, setVoteSuccess] = useState(false);
    const [isElectionActive, setIsElectionActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const navigate = useNavigate();

    // Redirect if not a voter
    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (role !== 'voter') {
            navigate('/');
        }
    }, [navigate]);

    // Fetch candidates from backend
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
                const updatedCandidates = data.map((candidate: Candidate) => ({
                    ...candidate,
                    image_url: candidate.image_url.startsWith('http')
                        ? candidate.image_url
                        : `http://localhost:5000${candidate.image_url}`,
                    voteCount: candidate.voteCount || 0,
                }));
                setCandidates(updatedCandidates);

            } catch (error) {
                console.error('Error fetching candidates:', error);
                alert('Failed to load candidates. Please try again later.');
            }
        };

        fetchCandidates();
    }, []);

    // Check election status and time remaining
    useEffect(() => {
        const checkElectionStatus = async () => {
            try {
                const response = await fetch('http://localhost:5000/election-dates', {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch election dates');
                }

                const data = await response.json();

                if (data.length === 0) {
                    setIsElectionActive(false);
                    return;
                }

                const latestElection = data[data.length - 1];
                const startDate = new Date(latestElection.start_date);
                const end_Date = new Date(latestElection.end_date);
                const now = new Date();

                setIsElectionActive(now >= startDate && now <= end_Date);
                setEndDate(end_Date);

            } catch (error) {
                console.error('Error fetching election dates:', error);
                alert('Failed to check election status. Please try again later.');
                setIsElectionActive(false);
            }
        };

        checkElectionStatus();
    }, []);

    // Update time remaining when election is active
    useEffect(() => {
        if (isElectionActive && endDate) {
            const intervalId = setInterval(() => {
                const now = new Date();
                const difference = endDate.getTime() - now.getTime();

                if (difference > 0) {
                    setTimeRemaining(Math.floor(difference / 1000));
                } else {
                    setTimeRemaining(0);
                    setIsElectionActive(false);
                    clearInterval(intervalId);
                }
            }, 1000);

            return () => clearInterval(intervalId);
        }
    }, [isElectionActive, endDate]);

    const formatTime = (seconds: number | null) => {
        if (seconds === null) {
            return 'Loading...';
        }
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
    };

    const handleVote = async (candidateId: number) => {
        try {
            const response = await fetch(`http://localhost:5000/vote/${candidateId}`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error) {
                    alert(errorData.error);
                } else {
                    alert('Failed to cast vote. Please try again.');
                }
                return;
            }

            setVotesPerPosition(prev => ({ ...prev, [candidateId]: true }));
            setVoteSuccess(true);

            // Update vote count locally
            setCandidates(prevCandidates =>
                prevCandidates.map(candidate =>
                    candidate.id === candidateId
                        ? { ...candidate, voteCount: candidate.voteCount + 1 }
                        : candidate
                )
            );

            setTimeout(() => {
                setVoteSuccess(false);
            }, 3000);

            setShowResults(true);

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

    if (!isElectionActive) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800">404 - Page Not Found</h1>
                    <p className="text-gray-600 mt-4">
                        The voting period is not currently active. Please check back later.
                    </p>
                </div>
            </div>
        );
    }

    // Group candidates by position
    const groupedCandidates = candidates.reduce((acc, candidate) => {
        if (!acc[candidate.position]) {
            acc[candidate.position] = [];
        }
        acc[candidate.position].push(candidate);
        return acc;
    }, {} as Record<string, Candidate[]>);

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Voter Dashboard</h1>
                    {isElectionActive && (
                        <div className="text-blue-600 font-bold">
                            Time Remaining: {formatTime(timeRemaining)}
                        </div>
                    )}
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
                {voteSuccess && (
                    <div className="bg-green-200 text-green-800 p-3 rounded mb-4">
                        Vote cast successfully!
                    </div>
                )}

                {/* Candidates Display */}
                {!voteSuccess && (
                    <div className="flex flex-wrap gap-6">
                        {Object.keys(groupedCandidates).map(position => (
                            <div key={position} className="w-full lg:w-1/3 xl:w-1/4 bg-white p-6 rounded-lg shadow-lg">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">{position}</h3>
                                {groupedCandidates[position].map(candidate => (
                                    <div key={candidate.id} className="mb-6 border-b pb-4">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={candidate.image_url}
                                                alt={candidate.name}
                                                className="w-16 h-16 object-cover rounded-full"
                                            />
                                            <div className="flex-1">
                                                <h4 className="text-lg font-semibold text-gray-800">{candidate.name}</h4>
                                                <p className="text-gray-600 text-sm">{candidate.manifesto}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-between items-center">
                                            <button
                                                onClick={() => handleVote(candidate.id)}
                                                disabled={votesPerPosition[candidate.id] || false}
                                                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                                                    votesPerPosition[candidate.id]
                                                        ? 'bg-green-600'
                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                }`}
                                            >
                                                <Vote className="mr-2 h-5 w-5" />
                                                {votesPerPosition[candidate.id] ? 'Voted' : 'Vote'}
                                            </button>
                                            <span className="text-gray-700 text-lg">
                                                {showResults ? candidate.voteCount : '-'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
