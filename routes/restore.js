import express from "express";
import { EC2Client, RunInstancesCommand } from "@aws-sdk/client-ec2";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const ec2Client = new EC2Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ♻️ استرجاع سيرفر من Backup (AMI)
router.post("/from-ami/:amiId", async (req, res) => {
  const { amiId } = req.params;

  try {
    const command = new RunInstancesCommand({
    ImageId: amiId,
    InstanceType: "t3.micro",
    KeyName: "myDeffaultKeyPair",
    MinCount: 1,
    MaxCount: 1,
    TagSpecifications: [
        {
        ResourceType: "instance",
        Tags: [{ Key: "Name", Value: `restored-from-${amiId}` }],
        },
    ],
    });


    const response = await ec2Client.send(command);
    const instanceId = response.Instances[0].InstanceId;

    res.json({
      message: "✅ Server restored successfully from backup!",
      instanceId,
    });
  } catch (err) {
    console.error("❌ Restore error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
