const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const RegistrationToken = require('../models/RegistrationToken');

exports.signup = async (req, res) => {
    const { email, username, password, token } = req.body;

    try {
        const reg = await RegistrationToken.findOne({ token, email });
        if (!reg || reg.expiresAt < new Date() || reg.used) {
            return res.status(400).json({ error: 'Invalid or expired registration token' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ email, username, password: hashedPassword });
        await user.save();

        reg.used = true;
        await reg.save();

        res.status(201).json({ message: 'Signup successful' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({ email:user.email, username:user.username, role:user.role, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
