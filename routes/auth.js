// routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/connections.js";

const router = express.Router();

// 🔹 صفحة التسجيل
router.get("/register", (req, res) => {
  res.render("pages/register", { title: "Register" });
});

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashed]);
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error registering user");
  }
});

// 🔹 صفحة تسجيل الدخول
router.get("/login", (req, res) => {
  res.render("pages/login", { title: "Login" });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
    const user = result.rows[0];

    if (!user) return res.status(400).send("User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).send("Invalid credentials");

    // ✅ حفظ المستخدم في السيشن
    req.session.user = { id: user.id, username: user.username };
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error logging in");
  }
});

// 🔹 تسجيل الخروج
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});


export default router;
