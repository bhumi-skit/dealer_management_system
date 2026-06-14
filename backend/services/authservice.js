const User = require('../models/User');
const jwt = require('jsonwebtoken');


const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role }, // Using user._id and user.role dynamically
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Set your preferred expiration here 
    );
};

exports.loginUser = async (email, password) => {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    // 2. Pass the entire 'user' object, not just the ID string, so generateToken can read the role
    const token = generateToken(user);

    return { user, token };
};

exports.registerUser = async (data) => {
    const { name, email, password , role,secretCode  } = data;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new Error('User already exists');
    }
    if (role === 'admin') {
        if (secretCode !== process.env.ADMIN_CODE) {
            throw new Error('Invalid admin secret code');
        }
    } else if (role === 'guard') {
        if (secretCode !== process.env.GUARD_CODE) {
            throw new Error('Invalid guard secret code');
        }
    }

    const user = await User.create({
        name,
        email,
        password, 
        role:role||'viewer'
    });

    // 3. Pass the entire 'user' object here too
    const token = generateToken(user);

    return { user, token };
};