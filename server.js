import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import serversRouter from "./routes/servers.js";
import { pool } from "./db/connections.js";

// --- SOCKET.IO SETUP FOR SSH TERMINAL ---
import { Server } from "socket.io";
import { readFile } from "fs/promises";
import { Client } from "ssh2";

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use("/servers", serversRouter);

app.get("/", async (req, res) => {
    try {
    const result = await pool.query("SELECT * FROM servers ORDER BY created_at DESC");
    res.render("pages/index", { title: "Dashboard", servers: result.rows });
  } catch (err) {
    console.error(err);
    res.render("pages/index", { title: "Dashboard", servers: [] });
  }
});

app.get("/create-server", (req, res) => res.render("pages/create-server", { title: "Create Server" }));

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// bne3mel socket.io server 3ala nafs el http server
const io = new Server(5001, {
  cors: { origin: "*" }, // 3ashan el frontend ye2dar yconnect
});

io.on("connection", (socket) => {
  console.log("⚡ New WebSocket connection for SSH");

  // lma el frontend yeb3at request 3ashan yconnect bel server
  socket.on("start-ssh", async (data) => {
    const { host, username, privateKeyPath } = data; // el data el gay men frontend
    const conn = new Client();

    try {
      const privateKey = await readFile(privateKeyPath, "utf8");

      // bneft7 ssh connection 3ala el EC2 instance
      conn
        .on("ready", () => {
          console.log(`✅ Connected to ${host} via SSH`);
          socket.emit("data", `Connected to ${host}\r\n`);

          // bneft7 shell session
          conn.shell((err, stream) => {
            if (err) {
              socket.emit("data", `Error starting shell: ${err.message}\r\n`);
              return;
            }

            // lma yegi output men el server
            stream.on("data", (chunk) => {
              socket.emit("data", chunk.toString());
            });

            // lma el user yeb3at command men el terminal
            socket.on("command", (cmd) => {
              stream.write(cmd + "\n"); // bnektb el command fe el ssh stream
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
