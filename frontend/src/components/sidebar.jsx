import React from 'react';
import { useNavigate } from 'react-router-dom';

const sidebar = ({ onNavigate }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="w-full md:w-64 bg-gray-800 text-white min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-6">My Dashboard</h2>

      <ul className="space-y-4">
        <li>
          <button onClick={() => onNavigate('dashboard')} className="w-full text-left hover:text-blue-400">Dashboard</button>
        </li>
        <li>
          <button onClick={() => onNavigate('profile')} className="w-full text-left hover:text-blue-400">Profile</button>
        </li>
        <li>
          <button onClick={handleLogout} className="w-full text-left text-red-400 hover:text-red-300">Logout</button>
        </li>
      </ul>
    </div>
  );
};

export default sidebar;
