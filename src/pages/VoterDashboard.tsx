import React, { useState, useEffect } from 'react';
import { Eye, LogOut } from 'lucide-react';
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
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [voteSuccess, setVoteSuccess] = useState(false);
    const [isElectionActive, setIsElectionActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [voterVotes, setVoterVotes] = useState<Record<string, number | null>>({});
    const navigate = useNavigate();
    const backendURL = 'http://localhost:5000'; // Backend URL

    // Check if the user is logged in as a voter
    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (role !== 'voter') {
            navigate('/');
        }
    }, [navigate]);

    // Fetch candidates from the backend
    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const response = await fetch(`${backendURL}/candidates`, {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!response.ok) throw new Error('Failed to fetch candidates');
                const data = await response.json();
                setCandidates(data);
            } catch (error) {
                console.error('Error fetching candidates:', error);
                alert('Failed to load candidates. Please try again later.');
            }
        };
        fetchCandidates();
    }, []);

    // Fetch election dates and check election status
    useEffect(() => {
        const checkElectionStatus = async () => {
            try {
                const response = await fetch(`${backendURL}/election-dates`, {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!response.ok) throw new Error('Failed to fetch election dates');
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
            }
        };
        checkElectionStatus();
    }, []);

    // Calculate time remaining for the election
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

   // Fetch voter's previous votes
   useEffect(() => {
    const fetchUserSession = async () => {
        try {
            const response = await fetch(`${backendURL}/session`, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();
            console.log("User session:", data);

            if (!response.ok || !data.id) {
                console.error("Error: User session is missing.");
                alert("Your session expired. Please log in again.");
                return;
            }

            localStorage.setItem('userId', data.id); // Store for later use
            fetchVoterVotes(data.id); // Fetch votes using the session ID
        } catch (error) {
            console.error("Error fetching session:", error);
        }
    };

    const fetchVoterVotes = async (voterId: number) => {
        try {
            console.log("Fetching votes for voter ID:", voterId);

            const response = await fetch(`${backendURL}/check-vote-status`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registrationNumber: voterId }),
            });

            const responseData = await response.json();
            console.log("Vote Status Response:", responseData);

            if (!response.ok) {
                throw new Error(responseData.message || "Failed to fetch voter votes");
            }

            setVoterVotes(responseData.votes || {});
        } catch (error) {
            console.error("Error fetching voter votes:", error);
        }
    };

    fetchUserSession();
}, []);

    // Handle voting for a candidate
    const handleVote = async (candidateId: number, position: string) => {
        try {
            const voterId = localStorage.getItem('userId'); // Get voter ID from localStorage
            const response = await fetch(`${backendURL}/vote/${candidateId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ voterId }),
            });
            if (!response.ok) throw new Error('Failed to cast vote');
            setVoteSuccess(true);
            setTimeout(() => setVoteSuccess(false), 3000);
            setVoterVotes(prev => ({ ...prev, [position]: candidateId })); // Update the state with the new vote
            setShowResults(true); // Show results after voting
        } catch (error) {
            console.error('Error casting vote:', error);
            alert('Failed to cast vote. Please try again later.');
        }
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await fetch(`${backendURL}/logout`, { method: 'POST', credentials: 'include' });
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            navigate('/');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    // Group candidates by position
    const groupedCandidates = candidates.reduce((acc, candidate) => {
        if (!acc[candidate.position]) acc[candidate.position] = [];
        acc[candidate.position].push(candidate);
        return acc;
    }, {} as Record<string, Candidate[]>);

    function formatTime(timeRemaining: number | null): React.ReactNode {
        if (timeRemaining === null) return 'N/A';

        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = timeRemaining % 60;

        return `${hours}h ${minutes}m ${seconds}s`;
    }
    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">Voter Dashboard</h1>
                <div className="text-blue-600 font-bold">Time Left: {formatTime(timeRemaining)}</div>
                <div className="flex gap-2">
                    <button onClick={() => setShowResults(!showResults)} className="px-3 py-1 bg-blue-600 text-white rounded">
                        <Eye className="h-4 w-4 inline" /> {showResults ? 'Hide Results' : 'View Results'}
                    </button>
                    <button onClick={handleLogout} className="px-3 py-1 bg-red-600 text-white rounded">
                        <LogOut className="h-4 w-4 inline" /> Logout
                    </button>
                </div>
            </header>
            <main className="max-w-4xl mx-auto p-4">
                {Object.keys(groupedCandidates).map(position => (
                    <div key={position} className="mb-4">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{position}</h3>
                        <table className="w-full bg-white shadow-md rounded-lg border border-gray-300">
                            <thead>
                                <tr className="bg-gray-200 text-gray-700">
                                    <th className="p-2">Image</th>
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Manifesto</th>
                                    <th className="p-2">Action</th>
                                    <th className="p-2">Votes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedCandidates[position].map(candidate => (
                                    <tr key={candidate.id} className="border-t hover:bg-gray-100 transition">
                                        <td className="p-2">
                                            {candidate.image_url ? (
                                                <img src={`${backendURL}${candidate.image_url}`} alt={candidate.name} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <img src="/default-profile.png" alt="Default" className="w-10 h-10 rounded-full object-cover" />
                                            )}
                                        </td>
                                        <td className="p-2">{candidate.name}</td>
                                        <td className="p-2">{candidate.manifesto}</td>
                                        <td className="p-2">
                                            <button
                                                onClick={() => handleVote(candidate.id, position)}
                                                className="px-2 py-1 bg-blue-500 text-white rounded"
                                                disabled={!!voterVotes[position] || !isElectionActive} // Disable if already voted for this position
                                            >
                                                {voterVotes[position] ? 'Voted' : 'Vote'}
                                            </button>
                                        </td>
                                        <td className="p-2">{showResults ? candidate.voteCount : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
                {voteSuccess && (
                    <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg">
                        Vote cast successfully!
                    </div>
                )}
                {showResults && (
                    <div className="mt-4">
                        <h2 className="text-lg font-bold">Election Results</h2>
                        <table className="w-full bg-white shadow-md rounded-lg border border-gray-300">
                            <thead>
                                <tr className="bg-gray-200 text-gray-700">
                                    <th className="p-2">Image</th>
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Position</th>
                                    <th className="p-2">Votes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.map(candidate => (
                                    <tr key={candidate.id} className="border-t hover:bg-gray-100 transition">
                                        <td className="p-2">
                                            {candidate.image_url ? (
                                                <img src={`${backendURL}${candidate.image_url}`} alt={candidate.name} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <img src="/default-profile.png" alt="Default" className="w-10 h-10 rounded-full object-cover" />
                                            )}
                                        </td>
                                        <td className="p-2">{candidate.name}</td>
                                        <td className="p-2">{candidate.position}</td>
                                        <td className="p-2">{candidate.voteCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}