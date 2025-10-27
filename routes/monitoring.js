import express from "express";
import { CloudWatchClient, GetMetricStatisticsCommand } from "@aws-sdk/client-cloudwatch";
import { pool } from "../db/connections.js";

const router = express.Router();

const cloudwatch = new CloudWatchClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // جلب بيانات السيرفر من الـ DB
    const result = await pool.query("SELECT instance_id FROM servers WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).send("Server not found");

    const instanceId = result.rows[0].instance_id;

    // تحديد الفترة الزمنية
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 1000 * 60 * 60 * 3); // آخر 3 ساعات

    // استدعاء الميتريكس
    const metrics = await Promise.all([
      getMetric(instanceId, "CPUUtilization", "Average", "Percent"),
      getMetric(instanceId, "NetworkIn", "Sum", "Bytes"),
      getMetric(instanceId, "NetworkOut", "Sum", "Bytes"),
    ]);

    const data = {
      CPUUtilization: metrics[0],
      NetworkIn: metrics[1],
      NetworkOut: metrics[2],
    };

    // render للـ EJS
    res.render("pages/monitoring", {
      title: "Server Monitoring",
      metrics: data,
      serverId: id,
    });
  } catch (err) {
    console.error("❌ Monitoring error:", err);
    res.status(500).send("Error fetching monitoring data");
  }
});

async function getMetric(instanceId, metricName, stat, unit) {
  const command = new GetMetricStatisticsCommand({
    Namespace: "AWS/EC2",
    MetricName: metricName,
    Dimensions: [{ Name: "InstanceId", Value: instanceId }],
    StartTime: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours
    EndTime: new Date(),
    Period: 300,
    Statistics: [stat],
    Unit: unit,
  });

  const data = await cloudwatch.send(command);
  return data.Datapoints.sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
}

export default router;
