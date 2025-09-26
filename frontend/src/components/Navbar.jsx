import React, { useEffect, useState } from 'react';
import {Link} from 'react-router-dom'
const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!user);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    // Redirect or update UI as needed
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Logo / Home */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">Home</Link>
          </div>

          {/* Right: Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoggedIn ? (
              <>
              <Link to="/login" className="block text-gray-600 hover:text-gray-800">Login</Link>
              <Link to="/signup" className="block text-gray-600 hover:text-gray-800">Signup</Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pt-2 pb-3 space-y-1">
          {!isLoggedIn ? (
            <>
              <Link to="/login" className="block text-gray-600 hover:text-gray-800">Login</Link>
              <Link to="/signup" className="block text-gray-600 hover:text-gray-800">Signup</Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="block text-gray-600 hover:text-gray-800"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

