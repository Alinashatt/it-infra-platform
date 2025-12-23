// routes/restore.js
import express from "express";
import {
  EC2Client,
  RunInstancesCommand,
  DescribeImagesCommand,
} from "@aws-sdk/client-ec2";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

//enshel EC2 client with user credentials
function createEC2Client(req) {
  return new EC2Client({
    region: req.session.user?.aws_region || process.env.AWS_REGION,
    credentials: {
      accessKeyId: req.session.user?.aws_access_key || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: req.session.user?.aws_secret_key || process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

// ==================== est ====================
router.get("/select/:instanceId", async (req, res) => {
  const ec2 = createEC2Client(req);

  try {
    const command = new DescribeImagesCommand({ Owners: ["self"] });
    const response = await ec2.send(command);

    // بنعرض الصفحة بالـ Backups الموجودة
    res.render("pages/restore-list", {
      title: "Select Backup to Restore",
      backups: response.Images,
      instanceId: req.params.instanceId,
    });
  } catch (err) {
    console.error("❌ Error listing backups:", err);
    res.status(500).send("Error fetching backup list");
  }
});

// ==================== STEP 2: تنفيذ عملية الاسترجاع ====================
router.post("/from-ami/:amiId", async (req, res) => {
  const { amiId } = req.params;
  const ec2 = createEC2Client(req);

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

    const response = await ec2.send(command);
    const instanceId = response.Instances[0].InstanceId;

    res.render("pages/restore-success", {
      title: "Server Restored",
      instanceId,
      amiId,
    });
  } catch (err) {
    console.error("❌ Restore error:", err);
    res.status(500).send("Error restoring from backup");
  }
});

export default router;
