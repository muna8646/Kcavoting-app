import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Calendar, Building, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Vacancy {
    id: number;
    title: string;
    description: string;
    requirements: string;
}

interface Candidate {
    id: number;
    name: string;
    position: string;
    manifesto: string;
    image_url: string;
}

export function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('voters');
    const [vacancies, setVacancies] = useState<Vacancy[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);

    // Form states
    const [voterForm, setVoterForm] = useState({
        name: '',
        registrationNumber: '',
        nationalId: '',
        role: 'voter', // Default role
    });
    const [candidateForm, setCandidateForm] = useState<{ name: string; position: string; manifesto: string; image: File | null }>({ name: '', position: '', manifesto: '', image: null });
    const [vacancyForm, setVacancyForm] = useState({ title: '', description: '', requirements: '' });
    const [electionDate, setElectionDate] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchVacancies();
        fetchCandidates();
    }, []);

    const fetchVacancies = async () => {
        try {
            const response = await fetch('http://localhost:5000/vacancies');

            if (!response.ok) {
                console.error(`HTTP error! Status: ${response.status}`);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: Vacancy[] = await response.json(); // Type assertion
            setVacancies(data);
        } catch (error) {
            console.error('Error fetching vacancies:', error);
            alert('Failed to load vacancies. Please try again later.');
        }
    };

    const fetchCandidates = async () => {
        try {
            const response = await fetch('http://localhost:5000/candidates');

            if (!response.ok) {
                console.error(`HTTP error! Status: ${response.status}`);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: Candidate[] = await response.json(); // Type assertion
            setCandidates(data);
        } catch (error) {
            console.error('Error fetching candidates:', error);
            alert('Failed to load candidates. Please try again later.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/');
    };

    const handleVoterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/register-voter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...voterForm,
                    role: 'voter', // Ensure the role is always set to 'voter'
                }),
            });
            const data = await response.json();
            if (response.ok) {
                alert('Voter registered successfully');
                setVoterForm({
                    name: '',
                    registrationNumber: '',
                    nationalId: '',
                    role: 'voter', // Reset to default
                });
            } else {
                alert(data.message || 'Failed to register voter');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while registering the voter');
        }
    };

    const handleCandidateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', candidateForm.name);
        formData.append('position', candidateForm.position);
        formData.append('manifesto', candidateForm.manifesto);
        if (candidateForm.image) {
            formData.append('image', candidateForm.image);
        }

        try {
            const response = await fetch('http://localhost:5000/register-candidate', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                alert('Candidate registered successfully');
                setCandidateForm({ name: '', position: '', manifesto: '', image: null });
                fetchCandidates();
            } else {
                alert(data.message || 'Failed to register candidate');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while registering the candidate');
        }
    };

    const handleVacancySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/create-vacancy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vacancyForm),
            });
            const data = await response.json();
            if (response.ok) {
                alert('Vacancy created successfully');
                setVacancyForm({ title: '', description: '', requirements: '' });
                fetchVacancies();
            } else {
                alert(data.message || 'Failed to create vacancy');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while creating the vacancy');
        }
    };

    const handleElectionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/set-election-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(electionDate),
            });
            const data = await response.json();
            if (response.ok) {
                alert('Election date set successfully');
                setElectionDate({ start: '', end: '' });
            } else {
                alert(data.message || 'Failed to set election date');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while setting the election date');
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'voters':
                return (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-4">Register Voters</h2>
                        <form onSubmit={handleVoterSubmit} className="space-y-4">
                            <input
                                type="text"
                                value={voterForm.name}
                                onChange={(e) => setVoterForm(prev => ({ ...prev, name: e.target.value }))}
                                required
                                placeholder="Name"
                                className="w-full p-2 border rounded"
                            />
                            <input
                                type="text"
                                value={voterForm.registrationNumber}
                                onChange={(e) => setVoterForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                                required
                                placeholder="Registration Number"
                                className="w-full p-2 border rounded"
                            />
                            <input
                                type="text"
                                value={voterForm.nationalId}
                                onChange={(e) => setVoterForm(prev => ({ ...prev, nationalId: e.target.value }))}
                                required
                                placeholder="National ID"
                                className="w-full p-2 border rounded"
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
                            >
                                <UserPlus /> Register Voter
                            </button>
                        </form>
                    </div>
                );
            case 'candidates':
                return (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-4">Register Candidates</h2>
                        <form onSubmit={handleCandidateSubmit} className="space-y-4">
                            <input type="text" value={candidateForm.name} onChange={(e) => setCandidateForm(prev => ({ ...prev, name: e.target.value }))} required placeholder="Name" className="w-full p-2 border rounded" />
                            <select value={candidateForm.position} onChange={(e) => setCandidateForm(prev => ({ ...prev, position: e.target.value }))} required className="w-full p-2 border rounded">
                                <option value="">Select Position</option>
                                {vacancies.map((vacancy) => (
                                    <option key={vacancy.id} value={vacancy.title}>{vacancy.title}</option>
                                ))}
                            </select>
                            <textarea value={candidateForm.manifesto} onChange={(e) => setCandidateForm(prev => ({ ...prev, manifesto: e.target.value }))} required placeholder="Manifesto" className="w-full p-2 border rounded"></textarea>
                            <input type="file" onChange={(e) => {
                                const file = e.target.files ? e.target.files[0] : null;
                                setCandidateForm(prev => ({ ...prev, image: file }));
                            }} required className="w-full p-2 border rounded" />
                            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"><Users /> Register Candidate</button>
                        </form>
                    </div>
                );
            case 'vacancies':
                return (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-4">Manage Vacancies</h2>
                        <form onSubmit={handleVacancySubmit} className="space-y-4">
                            <input type="text" value={vacancyForm.title} onChange={(e) => setVacancyForm(prev => ({ ...prev, title: e.target.value }))} required placeholder="Position Title" className="w-full p-2 border rounded" />
                            <textarea value={vacancyForm.description} onChange={(e) => setVacancyForm(prev => ({ ...prev, description: e.target.value }))} required placeholder="Description" className="w-full p-2 border rounded"></textarea>
                            <textarea value={vacancyForm.requirements} onChange={(e) => setVacancyForm(prev => ({ ...prev, requirements: e.target.value }))} required placeholder="Requirements" className="w-full p-2 border rounded"></textarea>
                            <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 flex items-center gap-2"><Building /> Add Vacancy</button>
                        </form>
                    </div>
                );
            case 'election':
                return (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-4">Election Settings</h2>
                        <form onSubmit={handleElectionSubmit} className="space-y-4">
                            <input type="datetime-local" value={electionDate.start} onChange={(e) => setElectionDate(prev => ({ ...prev, start: e.target.value }))} required className="w-full p-2 border rounded" />
                            <input type="datetime-local" value={electionDate.end} onChange={(e) => setElectionDate(prev => ({ ...prev, end: e.target.value }))} required className="w-full p-2 border rounded" />
                            <button type="submit" className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 flex items-center gap-2"><Calendar /> Set Election Period</button>
                        </form>
                    </div>
                );
            case 'results':
                return (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-4">View All Results</h2>
                        <button onClick={() => setActiveTab('results')} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center gap-2"><Users /> View All Results</button>
                        <div className="mt-4">
                            {candidates.map((candidate) => (
                                <div key={candidate.id} className="border p-4 rounded-lg mb-4">
                                    <img src={candidate.image_url} alt={candidate.name} className="w-20 h-20 rounded-full" />
                                    <h3 className="text-lg font-bold">{candidate.name}</h3>
                                    <p>{candidate.position}</p>
                                    <p>{candidate.manifesto}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
                    <LogOut /> Logout
                </button>
            </header>
            <nav className="flex space-x-4 mb-6">
                <button onClick={() => setActiveTab('voters')} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center gap-2"><UserPlus /> Voters</button>
                <button onClick={() => setActiveTab('candidates')} className="bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center gap-2"><Users /> Candidates</button>
                <button onClick={() => setActiveTab('vacancies')} className="bg-yellow-500 hover:bg-yellow-700 text-white py-2 px-4 rounded flex items-center gap-2"><Building /> Vacancies</button>
                <button onClick={() => setActiveTab('election')} className="bg-purple-500 hover:bg-purple-700 text-white py-2 px-4 rounded flex items-center gap-2"><Settings /> Election</button>
            </nav>
            <main>
                {renderContent()}
            </main>
        </div>
    );
}
