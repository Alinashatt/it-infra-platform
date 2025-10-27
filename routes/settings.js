import express from "express";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// 📄 عرض صفحة الإعدادات
router.get("/", (req, res) => {
  res.render("pages/settings", {
    title: "Settings",
    awsAccessKey: process.env.AWS_ACCESS_KEY_ID || "",
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    awsRegion: process.env.AWS_REGION || "",
  });
});

// 💾 تحديث بيانات الإعدادات
router.post("/update", (req, res) => {
  const { awsAccessKey, awsSecretKey, awsRegion } = req.body;

  // نكتب القيم الجديدة في .env
  const newEnvContent = `
AWS_ACCESS_KEY_ID=${awsAccessKey}
AWS_SECRET_ACCESS_KEY=${awsSecretKey}
AWS_REGION=${awsRegion}
`;

  fs.writeFileSync(".env", newEnvContent);
  console.log("✅ AWS Settings updated successfully!");

  res.redirect("/settings");
});

export default router;
