import React, { useState } from 'react';

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true); // Show popup when login starts

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        onLogin(data);
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Login failed');
    }
    setIsLoggingIn(false); // Hide popup once login process completes
  };

  return (
    <div className="auth-container">
      {/* Conditionally render the logging in popup */}
      {isLoggingIn && (
        <div className="popup">
          <div className="popup-content">
            <p>Logging in...</p>
          </div>
        </div>
      )}
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account?{' '}
        <span onClick={onSwitchToRegister} className="link">
          Register here
        </span>
      </p>
    </div>
  );
};

export default Login;
