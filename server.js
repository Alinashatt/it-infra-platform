import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import serversRouter from "./routes/servers.js";
import { pool } from "./db/connections.js";

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
