import express from "express";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// 🧭 عرض صفحة الإعدادات
router.get("/", (req, res) => {
  res.render("pages/settings", {
    title: "Settings",
    env: {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
      AWS_REGION: process.env.AWS_REGION || "",
    },
  });
});

// 💾 تحديث القيم
router.post("/update", (req, res) => {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = req.body;

  const newEnv = `
PGHOST=${process.env.PGHOST}
PGUSER=${process.env.PGUSER}
PGPASSWORD=${process.env.PGPASSWORD}
PGDATABASE=${process.env.PGDATABASE}
PGPORT=${process.env.PGPORT}

AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_REGION=${AWS_REGION}

SESSION_SECRET=${process.env.SESSION_SECRET}
`;

  fs.writeFileSync(".env", newEnv);
  dotenv.config(); // reload .env

  res.redirect("/settings");
});

export default router;
