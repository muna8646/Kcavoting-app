import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Calendar, Building, BarChart, LogOut } from 'lucide-react';
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
  vote_count?: number;
}

interface Voter {
  id: number;
  name: string;
  registrationNumber: string;
  nationalId: string;
  role: string;
}

const API_BASE_URL = 'http://localhost:5000';

const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  },
  async post<T>(endpoint: string, data: any, headers: Record<string, string> = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  },
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('voters');
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [voterForm, setVoterForm] = useState({
    name: '',
    registrationNumber: '',
    nationalId: '',
    role: 'voter',
  });

  const [candidateForm, setCandidateForm] = useState({
    name: '',
    position: '',
    manifesto: '',
    image: null as File | null,
  });

  const [vacancyForm, setVacancyForm] = useState({
    title: '',
    description: '',
    requirements: '',
  });

  const [electionDate, setElectionDate] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        await Promise.all([fetchVacancies(), fetchCandidates()]);
      } catch (error: any) {
        setErrorMessage(error.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchVacancies = async () => {
    try {
      const data: Vacancy[] = await apiClient.get<Vacancy[]>('/vacancies');
      setVacancies(data);
    } catch (error: any) {
      console.error('Error fetching vacancies:', error);
      setErrorMessage('Failed to load vacancies. Please try again later.');
    }
  };

  const fetchCandidates = async () => {
    try {
      const data: Candidate[] = await apiClient.get<Candidate[]>('/candidates');
      setCandidates(data);
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
      setErrorMessage('Failed to load candidates. Please try again later.');
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data: Candidate[] = await apiClient.get<Candidate[]>('/results');
      setCandidates(data);
      setActiveTab('results');
    } catch (error: any) {
      console.error('Error fetching results:', error);
      setErrorMessage(error.message || 'Failed to fetch election results.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const handleVoterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    if (!voterForm.name || !voterForm.registrationNumber || !voterForm.nationalId) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    try {
      await apiClient.post('/register-voter', voterForm, {
        'Content-Type': 'application/json',
      });
      alert('Voter registered successfully!');
      setVoterForm({ name: '', registrationNumber: '', nationalId: '', role: 'voter' });
    } catch (error: any) {
      console.error('Error:', error);
      setErrorMessage(error.message || 'An error occurred while registering the voter.');
    }
  };

  const handleCandidateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    if (!candidateForm.name || !candidateForm.position || !candidateForm.manifesto || !candidateForm.image) {
      setErrorMessage('Please fill in all fields, including the image.');
      return;
    }

    const formData = new FormData();
    formData.append('name', candidateForm.name);
    formData.append('position', candidateForm.position);
    formData.append('manifesto', candidateForm.manifesto);
    if (candidateForm.image) {
      formData.append('image', candidateForm.image);
    }

    try {
      await apiClient.post('/register-candidate', formData);
      alert('Candidate registered successfully!');
      setCandidateForm({ name: '', position: '', manifesto: '', image: null });
      fetchCandidates();
    } catch (error: any) {
      console.error('Error:', error);
      setErrorMessage(error.message || 'An error occurred while registering the candidate.');
    }
  };

  const handleVacancySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    if (!vacancyForm.title || !vacancyForm.description || !vacancyForm.requirements) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    try {
      await apiClient.post('/create-vacancy', vacancyForm, {
        'Content-Type': 'application/json',
      });
      alert('Vacancy created successfully!');
      setVacancyForm({ title: '', description: '', requirements: '' });
      fetchVacancies();
    } catch (error: any) {
      console.error('Error:', error);
      setErrorMessage(error.message || 'An error occurred while creating the vacancy.');
    }
  };

  const handleElectionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    if (!electionDate.start || !electionDate.end) {
      setErrorMessage('Please fill in both start and end dates.');
      return;
    }

    try {
      await apiClient.post('/set-election-date', electionDate, {
        'Content-Type': 'application/json',
      });
      alert('Election date set successfully!');
      setElectionDate({ start: '', end: '' });
    } catch (error: any) {
      console.error('Error:', error);
      setErrorMessage(error.message || 'An error occurred while setting the election date.');
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center">Loading...</div>;
    }

    switch (activeTab) {
      case 'voters':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Register Voters</h2>
            <form onSubmit={handleVoterSubmit} className="space-y-4">
              <input
                type="text"
                value={voterForm.name}
                onChange={(e) => setVoterForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Name"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                value={voterForm.registrationNumber}
                onChange={(e) => setVoterForm((prev) => ({ ...prev, registrationNumber: e.target.value }))}
                required
                placeholder="Registration Number"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                value={voterForm.nationalId}
                onChange={(e) => setVoterForm((prev) => ({ ...prev, nationalId: e.target.value }))}
                required
                placeholder="National ID"
                className="w-full p-2 border rounded"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
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
              <input
                type="text"
                value={candidateForm.name}
                onChange={(e) => setCandidateForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Name"
                className="w-full p-2 border rounded"
              />
              <select
                value={candidateForm.position}
                onChange={(e) => setCandidateForm((prev) => ({ ...prev, position: e.target.value }))}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Select Position</option>
                {vacancies.map((vacancy) => (
                  <option key={vacancy.id} value={vacancy.title}>
                    {vacancy.title}
                  </option>
                ))}
              </select>
              <textarea
                value={candidateForm.manifesto}
                onChange={(e) => setCandidateForm((prev) => ({ ...prev, manifesto: e.target.value }))}
                required
                placeholder="Manifesto"
                className="w-full p-2 border rounded"
              />
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files ? e.target.files[0] : null;
                  setCandidateForm((prev) => ({ ...prev, image: file }));
                }}
                required
                className="w-full p-2 border rounded"
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Users /> Register Candidate
              </button>
            </form>
          </div>
        );

      case 'vacancies':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Manage Vacancies</h2>
            <form onSubmit={handleVacancySubmit} className="space-y-4">
              <input
                type="text"
                value={vacancyForm.title}
                onChange={(e) => setVacancyForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                placeholder="Position Title"
                className="w-full p-2 border rounded"
              />
              <textarea
                value={vacancyForm.description}
                onChange={(e) => setVacancyForm((prev) => ({ ...prev, description: e.target.value }))}
                required
                placeholder="Description"
                className="w-full p-2 border rounded"
              />
              <textarea
                value={vacancyForm.requirements}
                onChange={(e) => setVacancyForm((prev) => ({ ...prev, requirements: e.target.value }))}
                required
                placeholder="Requirements"
                className="w-full p-2 border rounded"
              />
              <button
                type="submit"
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Building /> Add Vacancy
              </button>
            </form>
          </div>
        );

      case 'election':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Set Election Dates</h2>
            <form onSubmit={handleElectionSubmit} className="space-y-4">
              <input
                type="datetime-local"
                value={electionDate.start}
                onChange={(e) => setElectionDate((prev) => ({ ...prev, start: e.target.value }))}
                required
                className="w-full p-2 border rounded"
              />
              <input
                type="datetime-local"
                value={electionDate.end}
                onChange={(e) => setElectionDate((prev) => ({ ...prev, end: e.target.value }))}
                required
                className="w-full p-2 border rounded"
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Calendar /> Set Election Dates
              </button>
            </form>
          </div>
        );

      case 'results':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Election Results</h2>
            {vacancies.map((vacancy) => {
              const candidatesForPosition = candidates.filter(
                (candidate) => candidate.position === vacancy.title
              );
              return (
                <div key={vacancy.id} className="mb-8">
                  <h3 className="text-lg font-semibold mb-2">{vacancy.title}</h3>
                  {candidatesForPosition.length > 0 ? (
                    <table className="min-w-full leading-normal">
                      <thead>
                        <tr>
                          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Candidate
                          </th>
                          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Votes
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidatesForPosition.map((candidate) => (
                          <tr key={candidate.id}>
                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                              {candidate.name}
                            </td>
                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                              {candidate.vote_count || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No candidates for this position.</p>
                  )}
                </div>
              );
            })}
          </div>
        );

      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul>
            <li
              className={`flex items-center gap-2 py-2 px-4 hover:bg-gray-700 rounded cursor-pointer ${
                activeTab === 'voters' ? 'bg-gray-700' : ''
              }`}
              onClick={() => setActiveTab('voters')}
            >
              <UserPlus /> Voters
            </li>
            <li
              className={`flex items-center gap-2 py-2 px-4 hover:bg-gray-700 rounded cursor-pointer ${
                activeTab === 'candidates' ? 'bg-gray-700' : ''
              }`}
              onClick={() => setActiveTab('candidates')}
            >
              <Users /> Candidates
            </li>
            <li
              className={`flex items-center gap-2 py-2 px-4 hover:bg-gray-700 rounded cursor-pointer ${
                activeTab === 'vacancies' ? 'bg-gray-700' : ''
              }`}
              onClick={() => setActiveTab('vacancies')}
            >
              <Building /> Vacancies
            </li>
            <li
              className={`flex items-center gap-2 py-2 px-4 hover:bg-gray-700 rounded cursor-pointer ${
                activeTab === 'election' ? 'bg-gray-700' : ''
              }`}
              onClick={() => setActiveTab('election')}
            >
              <Calendar /> Election
            </li>
            <li
              className={`flex items-center gap-2 py-2 px-4 hover:bg-gray-700 rounded cursor-pointer ${
                activeTab === 'results' ? 'bg-gray-700' : ''
              }`}
              onClick={fetchResults}
            >
              <BarChart /> Results
            </li>
          </ul>
        </nav>
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <LogOut /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
        {renderContent()}
      </div>
    </div>
  );
}