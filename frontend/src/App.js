import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Assessment from './components/Assessment';
import AdminPanel from './components/AdminPanel';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <div className="App">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        user.role === 'admin' ? (
          <AdminPanel onLogout={handleLogout} />
        ) : (
          <Assessment user={user} onLogout={handleLogout} />
        )
      )}
    </div>
  );
}

export default App;
