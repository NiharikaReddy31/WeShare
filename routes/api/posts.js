const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult, body } = require("express-validator");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Post = require("../../models/Posts");

// route            POST api/posts
// access           Private
// Description      Create a post
router.post("/", [auth, [
    check("text", "Text is required").not().isEmpty()
]
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            }
            );
        }
        try {
            const user = await User.findById(req.user.id).select("-password")
            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            });
            const post = await newPost.save();
            res.json(post);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }

    });

// route            GET api/posts
// access           Private
// Description      Get all posts

router.get("/", auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// route            GET api/posts/:id
// access           Private
// Description      Get post by id

router.get("/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: "Post not found" })
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
            return res.status(404).json({ msg: "Post not found" })
        }
        res.status(500).send("Server Error");
    }
});

// route            DELETE api/posts/:id
// access           Private
// Description      delete post by id

router.delete("/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: "Post not found" })
        }
        // Check user owning the post is same as logged in user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: "User not Authorized" })
        }
        await post.remove();
        res.json({ msd: "Post deleted" });
    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
            return res.status(404).json({ msg: "Post not found" })
        }
        res.status(500).send("Server Error");
    }
});

module.exports = router;