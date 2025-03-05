const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection configuration (the database will be created if it doesn't exist)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'siginup', // This will be created if not exists
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

// Database initialization:
// 1. Connect without a database to create it if needed.
// 2. Create a pool using the database.
// 3. Create the necessary tables (users and sessions).
async function initializeDatabase() {
  // Step 1: Connect without specifying the database to create it.
  const tempConnection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    multipleStatements: true
  });
  await tempConnection.query('CREATE DATABASE IF NOT EXISTS siginup');
  await tempConnection.end();

  // Step 2: Create a connection pool using the database.
  const pool = mysql.createPool(dbConfig);

  // Step 3: Create the 'users' table.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Create the 'sessions' table (since it's used during login).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  return pool;
}

// JWT secret key (replace with a strong secret in production)
const JWT_SECRET = 'your-secret-key';

// Middleware to verify JWT token.
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Declare pool in a scope accessible by our endpoints.
let pool;

// User Registration Endpoint.
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!pool) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO users (id, username, email, password) VALUES (UUID(), ?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User Login Endpoint.
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!pool) {
      return res.status(500).json({ error: 'Database not initialized' });
    }
  
    try {
      const [users] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
  
      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      const user = users[0];
      const validPassword = await bcrypt.compare(password, user.password);
  
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Create a session in the sessions table.
      await pool.execute(
        'INSERT INTO sessions (id, user_id) VALUES (UUID(), ?)',
        [user.id]
      );
  
      // Generate a JWT token.
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
  
      res.json({ token, username: user.username });
    } catch (error) {
      console.error('Login error:', error);
      // Send error details for debugging
      res.status(500).json({ error: 'Login failed', details: error.message });
    }
  });
  

// (Optional) A protected route example.
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Initialize the database and start the server only after the pool is ready.
const PORT = process.env.PORT || 3001;
initializeDatabase()
  .then((p) => {
    pool = p;
    console.log('Database initialized and pool created successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database and create pool:', error);
    process.exit(1);
  });
