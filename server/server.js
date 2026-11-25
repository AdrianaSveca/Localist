require("dotenv").config();
const cors = require("cors");
const express = require("express");
const db = require("./database");
const app = express();
app.use(express.json());
const session = require("express-session");
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
    
}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60
    }
}));


const PORT = 3000;
const bcrypt = require("bcrypt");

app.get("/", (req,res) => {
    res.send("Localist backend is running");
})

app.post("/login", async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
    return res.status(400).send("Email and password are required");
}
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);


    if (!user) {
    return res.status(401).send("Invalid email or password");
}
const passwordMatch = await bcrypt.compare(password, user.password);
if (!passwordMatch) {
    return res.status(401).send("Invalid email or password");
}
req.session.userId = user.id;
return res.status(200).send("Login successful");

});
app.get("/check-session", (req, res) => {
    res.send(req.session.userId
        ? `Logged in as user ${req.session.userId}`
        : "Not logged in");
});




app.post("/register", async (req,res)=>{
    console.log(req.body.email);

    if (!req.body.username){
        return res.status(400).send("Username missing");
    }
    else if (!req.body.email){
        return res.status(400).send("Email missing");
    }
    else if (!req.body.password){
        return res.status(400).send("Password missing");
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    try {
        const insertUser = db.prepare(`
            INSERT INTO users (username, email, password)
            VALUES (?, ?, ?)`).run(
            req.body.username,
            req.body.email,
            hashedPassword
        );

        res.status(201).send("User registered successfully");
        
    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(409).send("Email is already registered");
        }

        return res.status(500).send("Registration failed");
    }
})

function authenticateUser(req, res, next) {
    if (!req.session.userId) {
    return res.status(401).send("Please log in first");
}
next();

}
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Logout failed");
        }

        res.clearCookie("connect.sid");
        res.send("Logged out successfully");
    });
});

app.get("/account", authenticateUser, (req, res) => {

    const user = db.prepare("SELECT id, username, email FROM users WHERE id = ?").get(req.session.userId);
    res.status(200).json(user);

});
app.put("/account", authenticateUser, (req, res) => {
    const { username, email } = req.body;
    const currentUser = db.prepare("SELECT username, email FROM users WHERE id = ?").get(req.session.userId);

    if (!username && !email) {
    return res.status(400).send("Please provide a username or email to update");
}

const newUsername = username || currentUser.username;
const newEmail = email || currentUser.email;
   
db.prepare("UPDATE users SET username = ?, email = ? WHERE id = ?").run(newUsername, newEmail, req.session.userId);res.status(200).send("Username updated successfully");


const existingUser = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(newEmail, req.session.userId);
    return res.status(409).send("Email is already in use");
});



app.put("/change-password", authenticateUser, async(req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
    return res.status(400).send("Both passwords are required");

    
}

const user = db.prepare("SELECT password FROM users WHERE id = ?").get(req.session.userId);
const passwordMatches = await bcrypt.compare(currentPassword, user.password);

if (!passwordMatches) {
    return res.status(401).send("Current password is incorrect");
}

const hashedPassword = await bcrypt.hash(newPassword, 10);
db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, req.session.userId);

res.status(200).send("Password changed successfully");
});





app.post("/profile", authenticateUser, (req, res) => {
    const { account_type, bio, location, skills } = req.body;
    if (account_type !== "freelancer" && account_type !== "business") {
    return res.status(400).send("Account type must be freelancer or business");
}
const existingProfile = db.prepare("SELECT id FROM profiles WHERE user_id = ?").get(req.session.userId);
if (existingProfile) {
    return res.status(409).send("You already have a profile");
}
db.prepare(`
    INSERT INTO profiles (user_id, account_type, bio, location, skills)
    VALUES (?, ?, ?, ?, ?)
`).run(req.session.userId, account_type, bio, location, skills);
res.status(201).send("Profile created successfully");
});


app.get("/profile", authenticateUser, (req, res) => {
    const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(req.session.userId);
    if (!profile) {
    return res.status(404).send("Profile not found");
}
res.status(200).json(profile);

});















app.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`);
} );

