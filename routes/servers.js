import express from "express";
import { pool } from "../db/connections.js";
import { exec } from "child_process";
import fs from "fs/promises";

const router = express.Router();

/**
 steps to create a server:
 1. han3mel post request 3ala /servers
 2. hanktb el terraform.tfvars file
 3. run terraform init
 4. run terraform apply
 5. hangeeb el output w hanstore el data fel database
 */

router.post("/", async (req, res) => { //async de 3ala4an el file writing w database operations asynchronous
  const { name, instance_type, region, storage, os } = req.body;

  try {
    // 1 create malaf terraform.tfvars
    const tfvarsContent = ` 
name          = "${name}"
instance_type = "${instance_type}"
region        = "${region}"
storage       = ${storage}
os            = "${os}"
`;

    await fs.writeFile("./terraform/terraform.tfvars", tfvarsContent);
    console.log("✅ terraform.tfvars created!");

    // 2 tashgheel terraform init
    exec("terraform init", { cwd: "./terraform" }, (initErr, initStdout, initStderr) => {
      if (initErr) {
        console.error("❌ Terraform init error:", initStderr);
        return res.status(500).send("Terraform init failed"); // lw fe error yeb3at 500 status ele heya internal server error
      }

      console.log("✅ Terraform initialized!");

      // 3. tashgheel terraform apply
      exec(
        "terraform apply -auto-approve -var-file=terraform.tfvars", // -auto-approve 3ashan ma yesa2alsh 3la confirmation ele heya elmafrod tkon yes
        {
          cwd: "./terraform", // el path elly feeh el terraform files
          env: {
            ...process.env,
            AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
          },
        },
        async (applyErr, stdout, stderr) => {
          if (applyErr) {
            console.error("❌ Terraform apply error:", stderr);
            return res.status(500).send("Terraform apply failed");
          }

          console.log("✅ Terraform apply completed!");

          // 4. el output bta3 el terraform in json
          exec("terraform output -json", { cwd: "./terraform" }, async (outErr, outStdout, outStderr) => {
            if (outErr) {
              console.error("❌ Terraform output error:", outStderr);
              return res.status(500).send("Terraform output failed");
            }

            let outputs = {};
            try {
              outputs = JSON.parse(outStdout.trim());
            } catch (parseErr) {
              console.error("❌ Failed to parse Terraform output:", parseErr);
            }

            const instance_id = outputs.instance_id ? outputs.instance_id.value : "unknown";

            // 5. insert fel database
            try {
              await pool.query(
                "INSERT INTO servers (name, instance_id, instance_type, region, storage, os, status) VALUES ($1,$2,$3,$4,$5,$6,$7)",
                [name, instance_id, instance_type, region, storage, os, "running"]
              );
              console.log(`✅ Server ${name} saved to database!`);
              res.redirect("/"); 
            } catch (dbErr) { 
              console.error("❌ Database insert error:", dbErr);
              res.status(500).send("Error saving to database");
            }
          });
        }
      );
    });
  } catch (err) { // general error handling
    console.error("❌ General error:", err);
    res.status(500).send("Internal server error");
  }
});

/**
 * GET /servers - Display all servers on the dashboard
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM servers ORDER BY created_at DESC");
    res.render("pages/index", { title: "Dashboard", servers: result.rows });
  } catch (err) {
    console.error("❌ Error fetching servers:", err);
    res.status(500).send("Error fetching servers");
  }
});

export default router;
