// routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/connections.js";

const router = express.Router();

// ==================== REGISTER PAGE ====================
router.get("/register", (req, res) => {
  res.render("pages/register", { title: "Register", error: null });
});

router.post("/register", async (req, res) => {
  const { username, password, aws_access_key, aws_secret_key, aws_region } = req.body;

  try {
    // hash el password
    const hashed = await bcrypt.hash(password, 10); // salt rounds = 10

    //eda5l el user fel database
    await pool.query(
      `INSERT INTO users (username, password, aws_access_key, aws_secret_key, aws_region)
       VALUES ($1, $2, $3, $4, $5)`,
      [username, hashed, aws_access_key, aws_secret_key, aws_region]
    );

    res.redirect("/login");
  } catch (err) {
    console.error("❌ Register error:", err);
    res.render("pages/register", {
      title: "Register",
      error: "❌ Error registering user. Try a different username."
    });
  }
});

// ==================== LOGIN PAGE ====================
router.get("/login", (req, res) => {
  res.render("pages/login", { title: "Login", error: null });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
    const user = result.rows[0];

    if (!user) { // user not found
      return res.render("pages/login", { title: "Login", error: "❌ User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render("pages/login", { title: "Login", error: "❌ Invalid credentials" });
    }

    // 7efz el user fel session 3ashan yeb2a logged in
    req.session.user = {
      id: user.id,
      username: user.username,
      aws_access_key: user.aws_access_key,
      aws_secret_key: user.aws_secret_key,
      aws_region: user.aws_region
    };

    res.redirect("/");
  } catch (err) {
    console.error("❌ Login error:", err);
    res.render("pages/login", { title: "Login", error: "❌ Error logging in. Please try again." });
  }
});

// ==================== LOGOUT ====================
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

export default router;  
