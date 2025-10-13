import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import serversRouter from "./routes/servers.js";

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

app.get("/", (req, res) => res.render("pages/index", { title: "Dashboard" })); //index.ejs

app.get("/create-server", (req, res) => res.render("pages/create-server", { title: "Create Server" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
