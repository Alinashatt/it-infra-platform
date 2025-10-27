import express from "express";
import { EC2Client, CreateImageCommand, DescribeImagesCommand } from "@aws-sdk/client-ec2";
import dotenv from "dotenv";
import { pool } from "../db/connections.js"; // ✅ ضيف الاتصال بقاعدة البيانات

dotenv.config();

const router = express.Router();

const ec2Client = new EC2Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // ✅ خليه نفس اسم المتغيرات اللي في .env
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 🧱 إنشاء Backup (AMI)
router.post("/create/:instanceId", async (req, res) => {
  const { instanceId } = req.params;

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const amiName = `backup-${instanceId}-${timestamp}`;

    const command = new CreateImageCommand({
      InstanceId: instanceId,
      Name: amiName,
      NoReboot: true,
    });

    const response = await ec2Client.send(command);
    const amiId = response.ImageId;

    // ✅ حفظ الـ AMI في قاعدة البيانات
    await pool.query("UPDATE servers SET ami_id=$1 WHERE instance_id=$2", [amiId, instanceId]);

    res.json({ message: "✅ Backup started successfully and saved to DB", amiId });
  } catch (err) {
    console.error("Backup error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🧾 عرض كل الـ Backups
router.get("/list", async (req, res) => {
  try {
    const command = new DescribeImagesCommand({ Owners: ["self"] });
    const response = await ec2Client.send(command);
    res.json(response.Images);
  } catch (err) {
    console.error("List backup error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
