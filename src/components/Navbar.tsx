import { Link, useNavigate } from 'react-router-dom';
import { Vote, LogOut } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Vote className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">KCA Voting</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/positions" className="text-gray-700 hover:text-blue-600">
              Vote Now
            </Link>
            <Link to="/results" className="text-gray-700 hover:text-blue-600">
              Results
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-700 hover:text-blue-600"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}