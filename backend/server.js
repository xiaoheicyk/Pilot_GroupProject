const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/employee', require('./routes/employeeRoutes'));
app.use('/employee/opt', require('./routes/optRoutes'));
app.use('/hr', require('./routes/hrRoutes'));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
