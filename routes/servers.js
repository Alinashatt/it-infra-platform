import express from "express";
import { pool } from "../db/connections.js";
import { exec } from "child_process";
import fs from "fs/promises";

const router = express.Router();

async function runTerraform(command) { //function 3awez afhamha aktar 3ala4an wakhedha mn chatgpt
  return new Promise((resolve, reject) => {  // function bterga3 promise 3awez a3ml await 3aleha
    exec(command, { cwd: "./terraform", env: process.env }, (err, stdout, stderr) => {
      if (err) reject(stderr);
      else resolve(stdout);
    });
  });
}

/**
 steps to create a server:
 1. han3mel post request 3ala /servers
 2. hanktb el terraform.tfvars file
 3. run terraform init
 4. run terraform apply
 5. hangeeb el output w hanstore el data fel database
 */

router.post("/", async (req, res) => { //async de 3ala4an el file writing w database operations asynchronous
  const { name, instance_type, region, storage, os, apps } = req.body;

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
    
    await pool.query(
      "INSERT INTO servers (name, instance_type, region, storage, os, status) VALUES ($1,$2,$3,$4,$5,$6)",
      [name, instance_type, region, storage, os, "provisioning"]
    );

    // 2 tashgheel terraform init
    exec("terraform init", { cwd: "./terraform" }, async (initErr, initStdout, initStderr) => {
      if (initErr) {
        await pool.query("UPDATE servers SET status=$1 WHERE name=$2", ["error", name]);
        console.error("❌ Terraform init error:", initStderr);
        return res.status(500).send("Terraform init failed");// 500 internal server error
      }

      console.log("✅ Terraform initialized!");

      // 3. tashgheel terraform apply
      exec(
        "terraform apply -auto-approve -var-file=terraform.tfvars",
        {
          cwd: "./terraform",
          env: {
            ...process.env,
            AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
          },
        },
        async (applyErr, stdout, stderr) => {
          if (applyErr) {
            await pool.query("UPDATE servers SET status=$1 WHERE name=$2", ["error", name]);
            console.error("❌ Terraform apply error:", stderr);
            return res.status(500).send("Terraform apply failed");
          }

          console.log("✅ Terraform apply completed!");
          await pool.query("UPDATE servers SET status=$1 WHERE name=$2", ["configuring", name]);
          // 4. el output bta3 el terraform in json

          exec("terraform output -json", { cwd: "./terraform" }, async (outErr, outStdout, outStderr) => { //-json 3awez el output yeb2a json
            if (outErr) {
              await pool.query("UPDATE servers SET status=$1 WHERE name=$2", ["error", name]);
              console.error("❌ Terraform output error:", outStderr);
              return res.status(500).send("Terraform output failed");
            }

            let outputs = {};// 3awez a3ml parse lel json output
            try {
              outputs = JSON.parse(outStdout.trim());
            } catch (parseErr) {
              await pool.query("UPDATE servers SET status=$1 WHERE name=$2", ["error", name]);
              console.error("❌ Failed to parse Terraform output:", parseErr);
            }

            const instance_id = outputs.instance_id ? outputs.instance_id.value : "unknown"; 
            const public_ip = outputs.instance_public_ip ? outputs.instance_public_ip.value : null;

            if (public_ip) {
              const inventoryContent = `[ec2_instances]${public_ip} ansible_user=${os === "ubuntu" ? "ubuntu" : "ec2-user"} ansible_ssh_private_key_file=~/.ssh/myDeffaultKeyPair.pem`;
              await fs.writeFile("./ansible/inventory.ini", inventoryContent);
              console.log("✅ Ansible inventory.ini created!");
            }
            
            // 5. run ansible playbook law fe apps selected
            setTimeout(() => {  
              if (apps && apps.length > 0 && public_ip) {
                console.log("🚀 Running Ansible for apps:", apps);
                
                // exec(
                //   `ansible-playbook -i ansible/inventory.ini ansible/playbook.yml --extra-vars "apps=${JSON.stringify(apps)}"`,
                //   (err, stdout, stderr) => {
                //     console.log("📜 ANSIBLE STDOUT:\n", stdout);
                //     console.log("⚠️ ANSIBLE STDERR:\n", stderr);
                //     if (err) console.error("❌ Ansible error:", err);
                //     else console.log("✅ Ansible completed successfully!");
                //   }
                // );

                exec(
                  `ansible-playbook -i ansible/inventory.ini ansible/playbook.yml --extra-vars "apps=${JSON.stringify(apps)}" -e 'ansible_ssh_common_args="-o StrictHostKeyChecking=no -o ConnectTimeout=60"'`,
                  async (err, stdout, stderr) => {
                    console.log("📜 ANSIBLE STDOUT:\n", stdout);
                    console.log("⚠️ ANSIBLE STDERR:\n", stderr);
                    if (err) {
                      console.error("❌ Ansible error:", err);
                    
                      await pool.query("UPDATE servers SET status=$1 WHERE name=$2", ["error", name]);
                    
                    } else {
                      console.log("✅ Ansible completed successfully!");
                      await pool.query("UPDATE servers SET status=$1 WHERE name=$2", ["running", name]);
                    }
                  }
                );


              }
            }, 30000); //5 seconds delay 3awez ady el instance wa2t yeb2a ready lel ansible
            
            // 6. insert fel database
            if (public_ip) {
              const inventoryContent = `
            [ec2_instances]
            ${public_ip} ansible_user=${os === "ubuntu" ? "ubuntu" : "ec2-user"} ansible_ssh_private_key_file=~/.ssh/myDeffaultKeyPair.pem
            `;
              await fs.writeFile("./ansible/inventory.ini", inventoryContent);
              console.log("✅ Ansible inventory.ini created!");
              
              // 💾 Save server after getting public_ip
              try {
                await pool.query(
                  "UPDATE servers SET instance_id=$1, public_ip=$2, status=$3 WHERE name=$4",
                  [instance_id, public_ip, "running", name]
                );
                console.log(`✅ Server ${name} saved to database!`);
                res.redirect("/");
              } catch (dbErr) {
                console.error("❌ Database insert error:", dbErr);
                res.status(500).send("Error saving to database");
              }
            }

          });
        }
      );
    });
  } catch (err) {
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

// GET /servers/:id - Display details of a specific server
router.get("/:id", async (req, res) => {
  const { id } = req.params; //req.params de 3awez ageb el id mn el url 3aks ll req.body elli bygeb el data mn form body
  try {
    const result = await pool.query("SELECT * FROM servers WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).send("Server not found");
    }
    res.render("pages/server-details", { title: "Server Details", server: result.rows[0] });
  } catch (err) {
    console.error("❌ Error fetching server details:", err);
    res.status(500).send("Error fetching server details");
  }
});

// DELETE SERVER
router.post("/delete/:id", async (req, res) => {
  const serverId = req.params.id;

  try {
    const result = await pool.query("SELECT * FROM servers WHERE id = $1", [serverId]);
    if (result.rows.length === 0) {
      return res.status(404).send("Server not found");
    }

    const server = result.rows[0];
    const instanceId = server.instance_id;
    const region = server.region;

    console.log(`🧹 Deleting instance ${instanceId} in region ${region}...`);

    const tfvarsContent = ` 
name          = "${server.name}"
instance_type = "${server.instance_type}"
region        = "${region}"
storage       = ${server.storage}
os            = "${server.os}"
`;

    await fs.writeFile("./terraform/terraform.tfvars", tfvarsContent);

    exec(
      "terraform destroy -auto-approve -var-file=terraform.tfvars",
      {
        cwd: "./terraform",
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        },
      },
      async (destroyErr, stdout, stderr) => {
        if (destroyErr) {
          console.error("❌ Terraform destroy error:", stderr);
          await pool.query("UPDATE servers SET status=$1 WHERE name=$2", ["error", name]);
          return res.status(500).send("Terraform destroy failed");
        }

        console.log("✅ Terraform destroy completed!");
        await pool.query("DELETE FROM servers WHERE id = $1", [serverId]);
        console.log(`🗑️ Server ${server.name} removed from database!`);
        res.redirect("/");
      }
    );
  } catch (err) {
    console.error("❌ Error deleting server:", err);
    res.status(500).send("Internal server error");
  }
});

router.get("/:id/ssh", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM servers WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).send("Server not found");
    }

    const server = result.rows[0];
    res.render("pages/ssh-terminal", {
      title: `SSH to ${server.name}`,
      ip: server.public_ip,
      username: server.os === "ubuntu" ? "ubuntu" : "ec2-user",
    });
  } catch (err) {
    console.error("❌ Error loading SSH terminal:", err);
    res.status(500).send("Error loading SSH terminal");
  }
});

export default router;