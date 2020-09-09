const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const { check, validationResult } = require("express-validator");

// route        GET api/profile/me
// access       Private
// Description  Get current users profile
router.get("/me", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })
            .populate("user", ["name", "avatar"]);
        if (!profile) {
            return res.status(400).json({ msg: "There is no Profile for this User" })
        }
        res.json(profile);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// route        POST api/profile
// access       Private
// Description  Create or Update User Profile

router.post("/", [auth, [
    check("status", "Status is required").not().isEmpty(),
    check("skills", "Skills is required").not().isEmpty()
]
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            company,
            location,
            website,
            bio,
            skills,
            status,
            githubusername,
            youtube,
            twitter,
            instagram,
            linkedin,
            facebook
        } = req.body;

        // Build Profile object i.e we need check if the fields exists before saving to db
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }

        // Build Social Objects

        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;


        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                // if profile is present=> update

                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                );
                return res.json(profile);
            }
            // if profile is not present => create
            profile = new Profile(profileFields);
            await profile.save();
            return res.json(profile);
        }
        catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }
);

// route        GET api/profile
// access       Public
// Description  Get all Profiles

router.get("/", async (req, res) => {
    try {
        const profiles = await Profile.find().populate("user", ["name", "avatar"]);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// route        GET api/profile/user/:user_id
// access       Public
// Description  Get all Profile by User ID

router.get("/user/:user_id", async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate("user", ["name", "avatar"]);
        if (!profile) return res.status(400).json({
            msg: "No Profile found!"
        })
        res.json(profile);
    }
    catch (err) {
        console.error(err.message);
        if (err.kind == "ObjectId") {
            return res.status(400).json({ msg: "No Profile found!" })
        }
        res.status(500).send("Server Error");
    }
});


// route        DELETE api/profile
// access       Private
// Description  Delete user and Profile

router.delete("/", auth, async (req, res) => {
    try {
        // Remove Profile
        await Profile.findOneAndRemove({ user: req.user.id });
        // Rempve User
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: "User Deleted" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});



// route        PUT api/profile/experience
// access       Private
// Description  Add Profile Experience

router.put("/experience", [auth, [
    check("title", "Title is required").not().isEmpty(),
    check("company", "Company is required").not().isEmpty(),
    check("from", "From date is required").not().isEmpty()
]
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }
        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                profile.experience.unshift(newExp);
                await profile.save();
                res.json(profile);
            }
        }
        catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    }
);

module.exports = router;