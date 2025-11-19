const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://your-frontend.vercel.app"
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/journeys', require('./routes/journeys'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Trip-N-Drop API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
