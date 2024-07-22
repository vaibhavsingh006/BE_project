const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const userModel = require("./models/user");
const postModel = require('./models/post')

app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("home");
});

app.post("/create", async (req, res) => {
    let { email, name, username, password, age } = req.body;
    let user = await userModel.findOne({ email });
    if (user) res.send("Somthing Went Worng_!");

    else {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password, salt, function (err, hash) {
                const user = userModel.create({
                    name,
                    username,
                    email,
                    password: hash,
                    age,
                });

                let token = jwt.sign({ email: email, userid: user._id }, "secret");
                res.cookie("token", token);
                res.send(user);
            });
        });
    }
});

app.get("/profile", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email }).populate('posts');
    console.log(user);
    // user.populate('posts');
    console.log(req.cookies);
    res.render("profile", { user });
});

app.get("/like/:id", isLoggedIn, async function (req, res) {
    let post = await postModel.findOne({ _id: req.params.id }).populate('user');
    // post.likes.push(req.user.userid);

    if (post.likes.indexOf(req.user.userid) === -1) {
        post.likes.push(req.user.userid);
    } else {
        post.likes.splice(post.likes.indexOf(req.user.userid), 1)
    }
    await post.save();
    res.redirect("/profile");
});

app.get("/edit/:id", isLoggedIn, async function (req, res) {
    let post = await postModel.findOne({ _id: req.params.id });
    // post.likes.push(req.user.userid);
    console.log(post);
    res.render("edit", { post });
});

app.post("/update/:id", isLoggedIn, async function (req, res) {
    let post = await postModel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content });


    res.redirect('/profile');
});

app.post("/post", isLoggedIn, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    let { content } = req.body;

    let post = await postModel.create({
        user: user._id,
        content
    });

    user.posts.push(post._id);
    await user.save();

    res.redirect("/profile");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", async function (req, res) {
    let user = await userModel.findOne({ email: req.body.email });
    if (!user) res.send("Somthing Went worng Login side_!")

    else {
        bcrypt.compare(req.body.password, user.password, function (err, result) {
            if (!result) res.redirect("/login");
            else {
                let token = jwt.sign({ email: req.body.email, userid: user._id }, "secret");
                res.cookie("token", token);
                res.redirect("/profile");
            }
        });
    }
});

app.get("/logout", function (req, res) {
    res.cookie("token", "");
    res.redirect("/");
});

function isLoggedIn(req, res, next) {
    if (req.cookies.token === '') res.redirect('/login')
    else {
        let data = jwt.verify(req.cookies.token, 'secret');
        req.user = data;
        next();
    }
}

app.listen(3000, () => {
    console.log("running");
});
