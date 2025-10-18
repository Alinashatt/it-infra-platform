import pkg from "pg";
const { Pool } = pkg; // badal ma afta7 connection keda kol marra
import dotenv from "dotenv";// 3ashan a5od el environment variables mn .env file
dotenv.config();// load .env file

export const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT
});
