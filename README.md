<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2h5N2s3c2ZqM2U3c2R3ZXJ2dTJqM2R4c2R4M2R4c2R4M2R4c2R4M2QmcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7bu8sRnYp0kA6i1i/giphy.gif" alt="Financial Management Animation" width="100%">
</p>

# 💸 TuniFlow: Streamlining Tunisian Financial Management

📧 Contact: tuniflow.team@gmail.com  
🌐 [GitHub Repository](https://github.com/ITHunster/TuniFlow) *(Update with your actual repo link)*

---

## 📊 Balancing the Books in a Complex World

Spreadsheets overflowing with numbers. Deadlines for tax filings looming.  
Business owners and accountants juggle countless tasks to stay compliant with Tunisian regulations.  
The problem isn’t a lack of data — it’s the chaos of managing it.

**TuniFlow** simplifies financial management.

Developed as a 4th-year integrated project at **Esprit School of Engineering**, TuniFlow empowers:
- 📈 **Accountants** to streamline bookkeeping
- 💼 **Business Owners** to track fiscal health
- 🔍 **Financial Managers** to make data-driven decisions

Our mission is clear: **turn financial complexity into clarity**.

---

## 🎯 Project Vision

- 📋 **Automate Accounting** — Simplify Tunisian-compliant bookkeeping.
- 📊 **Generate Reports** — Create financial statements with ease.
- 🤖 **Leverage AI** — Automate tasks, predict trends, ensure compliance.
- 💡 **Empower Businesses** — Build a smarter financial ecosystem.

---

## 🚀 Features

- ✅ **Accounting Management**: Record transactions, manage ledgers, track expenses.
- 📑 **Financial Reporting**: Generate balance sheets, income statements, and cash flow reports.
- 🤖 **AI-Powered Insights**:
  - Detect anomalies in financial data
  - Predict cash flow trends
  - Recommend tax optimizations
- 🔍 **Compliance Checks**: Ensure adherence to Tunisian accounting standards.
- 🔐 **User Roles**: Admin, Accountant, Business Owner, Financial Manager (RBAC).
- 📊 **Dashboards**: Visualize financial health and KPIs.
- 🔔 **Real-Time Notifications**: Alerts for deadlines, anomalies, or reports.
- ⭐ **Feedback System**: Rate AI recommendations and user experience.
- 🔐 **Google Authentication** + Optional 2FA.
- 🛠️ **Backoffice for Admins**: Manage users and system settings.

---

## 🛠️ Tech Stack

### Backend

- **Node.js** & **Express** – RESTful API
- **MongoDB** & **Mongoose** – NoSQL database for financial data
- **Passport.js** – Google OAuth
- **JWT** – Secure token-based authentication
- **Nodemailer** – Email notifications for reports and alerts
- **Multer** – Upload financial documents

### Frontend

- **React** & **React Router** – Dynamic, responsive UI
- **Axios** – API communication
- **Context API** – Global state management
- **Tailwind CSS** – Modern, finance-friendly design

### AI

- **Python** & **Flask** – AI API for predictive analytics
- **scikit-learn**, **Pandas**, **TensorFlow** – Machine learning tools
- **venv** – Python dependency management

### DevOps

- **Jenkins** – CI/CD pipeline for seamless updates
- **dotenv** – Secure environment configuration
- **node-cron** – Scheduled AI model updates and report generation

---

## ⚙️ Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- Python (v3.8+)
- Git
- pip

---

### 🔧 Installation

```bash
# 1. Clone the repo
git clone https://github.com/ITHunster/TuniFlow.git
cd tuniflow

# 2. Backend Setup
cd tuniflow-backend
npm install
cd ..

# 3. Frontend Setup
cd tuniflow-frontend
npm install
cd ..

# 4. AI Setup
cd tuniflow-ai
python -m venv venv
source venv/bin/activate     # or venv\Scripts\activate on Windows
pip install -r requirements.txt
