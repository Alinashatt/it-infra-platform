import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db/connections.js";
import serversRouter from "./routes/servers.js";

// --- SOCKET.IO SETUP FOR SSH TERMINAL ---
import { Server } from "socket.io";
import { readFile } from "fs/promises";
import { Client } from "ssh2";

import monitoringRoutes from "./routes/monitoring.js"; // import monitoring routes

import backupRoutes from "./routes/backup.js";
import restoreRoutes from "./routes/restore.js";



dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📂 إعدادات الـ EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// 🧭 Routers
app.use("/servers", serversRouter);
app.use("/monitor", monitoringRoutes); // ✅ هنا مكانها الصح بعد تعريف app
app.use("/aws", backupRoutes);
app.use("/restore", restoreRoutes);

// 🏠 الصفحة الرئيسية
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM servers ORDER BY created_at DESC");
    res.render("pages/index", { title: "Dashboard", servers: result.rows });
  } catch (err) {
    console.error(err);
    res.render("pages/index", { title: "Dashboard", servers: [] });
  }
});

// 🖥️ صفحة إنشاء السيرفر
app.get("/create-server", (req, res) =>
  res.render("pages/create-server", { title: "Create Server" })
);

// 🚀 تشغيل السيرفر
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// 🌐 SOCKET.IO FOR SSH
const io = new Server(5001, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("⚡ New WebSocket connection for SSH");

  socket.on("start-ssh", async (data) => {
    const { host, username, privateKeyPath } = data;
    const conn = new Client();

    try {
      const privateKey = await readFile(privateKeyPath, "utf8");

      conn
        .on("ready", () => {
          console.log(`✅ Connected to ${host} via SSH`);
          socket.emit("data", `Connected to ${host}\r\n`);

          conn.shell((err, stream) => {
            if (err) {
              socket.emit("data", `Error starting shell: ${err.message}\r\n`);
              return;
            }

            stream.on("data", (chunk) => {
              socket.emit("data", chunk.toString());
            });

            socket.on("command", (cmd) => {
              stream.write(cmd + "\n");
            });

            stream.on("close", () => {
              socket.emit("data", "\r\nConnection closed.\r\n");
              conn.end();
            });
          });
        })
        .connect({
          host,
          port: 22,
          username,
          privateKey,
        });
    } catch (err) {
      socket.emit("data", `SSH connection error: ${err.message}\r\n`);
    }
  });
});
