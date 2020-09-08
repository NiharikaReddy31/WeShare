const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

// route        POST api/users
// access       Public
// description  Register User

router.post('/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Enter a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const { name, email, password } = req.body;
        try {
            // Check if user exists or not

            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ errors: [{ msg: "User already exists" }] })
            }

            //  get users gravator
            const avatar = gravatar.url(user, {
                size: "200",
                reading: "pg",
                default: "mm"
            });
            user = new User({
                name,
                email,
                avatar,
                password

            });

            // Encrypt Password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();

            // return JSON WebToken
            const payload = {
                user: {
                    id: user.id
                }
            }
            jwt.sign(payload,
                config.get("jwtSecret"),
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token })
                }
            );
        }
        catch (err) {
            console.error(err.message)
            res.status(500).send("Server error");
        }

    });

module.exports = router; 