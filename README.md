# 🧠 IT Infrastructure Automation Platform

### Automate your infrastructure provisioning, configuration, monitoring, and backups with a single dashboard.

---

## 🚀 Overview

The **IT Infrastructure Automation Platform** is a web-based solution designed to automate every part of managing cloud infrastructure — from provisioning EC2 instances using **Terraform**, configuring them via **Ansible**, to monitoring and backup management through **AWS CloudWatch** and **AMI snapshots**.

This project was developed as a **graduation project** at **Arab Open University** under the supervision of **Dr. Mahmoud Atallah**, by **Ali Nashat**.

---

## 🧩 Key Features

✅ **Server Provisioning** — Create EC2 instances automatically using Terraform.
✅ **Server Configuration** — Use Ansible to install software (Nginx, Docker, Node.js, Python).
✅ **Monitoring Dashboard** — View live metrics like CPU and Network stats from AWS CloudWatch.
✅ **Backup & Restore** — Create and restore AMI snapshots directly from the dashboard.
✅ **Authentication System** — Secure login and registration with session-based authentication.
✅ **Dynamic Settings** — Update AWS credentials directly from the app (without editing `.env`).
✅ **SSH Web Terminal** — Connect to your EC2 instances directly via an in-browser SSH terminal.

---

## 🛠️ Tech Stack

| Layer                        | Technologies                         |
| ---------------------------- | ------------------------------------ |
| **Frontend**                 | HTML, CSS, EJS, Bootstrap            |
| **Backend**                  | Node.js (Express.js)                 |
| **Database**                 | PostgreSQL                           |
| **Infrastructure as Code**   | Terraform                            |
| **Configuration Management** | Ansible                              |
| **Cloud Provider**           | AWS (EC2, CloudWatch, AMI Snapshots) |
| **Authentication**           | Express-Session                      |
| **Monitoring Charts**        | Chart.js                             |
| **Version Control**          | Git & GitHub                         |

---

## ⚙️ Project Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/Alinashatt/it-infra-platform.git
cd it-infra-platform
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Configure environment variables

Create a `.env` file in the root directory:

```env
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

PGHOST=localhost
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=infra_platform
PGPORT=5432

SESSION_SECRET=supersecretkey
```

### 4️⃣ Initialize PostgreSQL

Run the SQL script to create the `servers` and `users` tables:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE servers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  instance_id VARCHAR(100),
  instance_type VARCHAR(100),
  region VARCHAR(50),
  storage INT,
  os VARCHAR(50),
  status VARCHAR(50),
  public_ip VARCHAR(100),
  ami_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5️⃣ Run the app

```bash
npm run dev
```

Now open 👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🧱 Project Structure

```
it-infra-platform/
├── ansible/
│   ├── playbook.yml
│   └── inventory.ini
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── terraform.tfvars
├── db/
│   └── connections.js
├── routes/
│   ├── auth.js
│   ├── servers.js
│   ├── monitoring.js
│   ├── backup.js
│   ├── restore.js
│   └── settings.js
├── views/
│   ├── pages/
│   ├── partials/
│   └── layout.ejs
├── public/
│   └── css/style.css
├── .env
├── package.json
└── server.js
```

---

## 📊 Monitoring Example

You can view real-time metrics like **CPU utilization**, **Network In/Out**, and **memory usage** from AWS CloudWatch displayed with Chart.js graphs.

![Monitoring Dashboard Screenshot](./docs/monitoring-example.png)

---

## 🧰 Future Improvements

* Add Role-Based Access Control (RBAC).
* Multi-cloud support (Azure / GCP).
* Email alerts for high CPU usage.
* Add REST API endpoints for external automation.
* Integrate Prometheus + Grafana for deeper monitoring.

---

## 👨‍💻 Author

**Ali Nashat**
📍 Cairo, Egypt
📧 [anashat871@gmail.com](mailto:anashat871@gmail.com)
🔗 [LinkedIn](https://www.linkedin.com/in/ali-nashat-7a3bb122b/)