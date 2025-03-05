import React, { useState } from 'react';
// import LoggedInPopup from './LoggedInPopup';
import Login from './components/Login';
import Register from './components/Register';

const AuthComponent = () => {
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setShowPopup(true); // Show the popup when user logs in
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleSwitchToRegister = () => {
    setIsRegistering(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegistering(false);
  };

  return (
    <div>
      {user && showPopup ? (
        <Login user={user} onClose={handleClosePopup} />
      ) : isRegistering ? (
        <Register onSwitchToLogin={handleSwitchToLogin} />
      ) : (
        <Login onLogin={handleLogin} onSwitchToRegister={handleSwitchToRegister} />
      )}
    </div>
  );
};

export default AuthComponent;
