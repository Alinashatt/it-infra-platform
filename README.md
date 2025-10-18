## 🖥️ IT Infrastructure Automation Platform

### 📘 Overview

The **IT Infrastructure Automation Platform** automates the provisioning, configuration, and management of cloud infrastructure on **AWS**.
It helps system administrators and DevOps engineers easily create and monitor EC2 instances using a simple web dashboard.

---

### 🚀 Features

* **AWS EC2 Provisioning** – Automatically create instances using **Terraform**.
* **Custom Configurations** – Define instance type, storage, OS, and region through the web interface.
* **Ansible Integration** *(Coming soon)* – For automated server configuration and software deployment.
* **Monitoring Dashboard** *(Planned)* – View instance metrics and logs.
* **Backups & Snapshots** *(Planned)* – Automatic backup management through AWS.

---

### 🧰 Tech Stack

* **Backend:** Node.js, Express.js
* **Frontend:** EJS, HTML, CSS, JavaScript
* **Infrastructure as Code:** Terraform
* **Cloud Provider:** AWS (EC2, CloudWatch)
* **Database:** PostgreSQL

---

### ⚙️ Installation & Setup

#### 1️⃣ Clone the repository

```bash
git clone https://github.com/Alinashatt/it-infra-platform.git
cd it-infra-platform
```

#### 2️⃣ Install dependencies

```bash
npm install
```

#### 3️⃣ Configure environment variables

Create a `.env` file in the root directory and add:

```
PGHOST=your_postgres_host
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGDATABASE=your_postgres_database
PGPORT=5432

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

#### 4️⃣ Run the server

```bash
npm run dev
```

---

### 🧩 Terraform Folder Structure

```
terraform/
│── main.tf
│── variables.tf
│── outputs.tf
│── terraform.tfvars
```

---

### 📈 Future Improvements

* Add authentication & user roles
* Implement live monitoring dashboard
* Integrate Ansible for post-deployment configuration
* Add automated backup & restore module

---

### 👨‍💻 Author

**Ali Nashat**
📍 Cairo, Egypt
📧 [anashat871@gmail.com](mailto:anashat871@gmail.com)
🔗 [LinkedIn](https://www.linkedin.com/in/ali-nashat-7a3bb122b/)

Would you like me to make it **ready to copy-paste** with Markdown formatting (for your README.md file)?
That way, you can just create the file and paste it in one go.
