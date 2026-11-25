const Database = require("better-sqlite3");
const db = new Database("localist.db");
db.pragma("foreign_keys = ON");


db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT
    );
    CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    account_type TEXT NOT NULL,
    bio TEXT,
    location TEXT,
    skills TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
    );
`);


module.exports = db;
