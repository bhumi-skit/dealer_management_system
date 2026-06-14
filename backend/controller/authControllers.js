const authService = require('../services/authService');

exports.register = async (req, res) => {
    try {
        const result = await authService.registerUser(req.body);

        res.status(201).json({
            success: true,
            token: result.token,
            user: result.user
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await authService.loginUser(email, password);

        res.status(200).json({
            success: true,
            token: result.token,
            user: result.user
        });

    } catch (err) {
        res.status(401).json({
            success: false,
            message: err.message
        });
    }
};