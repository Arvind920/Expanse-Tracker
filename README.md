# 💰 FlowExpense — Personal Expense & Wealth Tracker

FlowExpense is a modern, responsive, and aesthetic personal finance web application built with **Node.js**, **Express**, semantic **HTML5**, modern **Vanilla CSS3**, and **Chart.js**. It helps you track your daily income and expenses, monitor monthly category budgets, set savings goals, and visualize cash flow trends.

---

## ✨ Features

- **📊 Interactive Financial Dashboard**:
  - Real-time KPI summary cards: **Net Balance**, **Monthly Income**, **Monthly Expenses**, and **Monthly Savings Rate %**.
  - **Expense Breakdown Chart**: Interactive doughnut chart showcasing category distributions and percentages.
  - **6-Month Cash Flow Trend**: Side-by-side historical comparison of income vs. expenses over time.
- **🏷️ Category Budgets with Visual Alerts**:
  - Set monthly spending ceilings per category.
  - Dynamic progress meters with safety thresholds:
    - 🟢 Normal (<70%)
    - 🟡 Warning (70% - 90%)
    - 🔴 Exceeded (100%+)
- **🎯 Savings Goals Tracker**:
  - Set milestone goals with target amounts, current progress, target dates, and custom color accents.
- **📝 Transaction Management**:
  - Add, edit, and delete income and expense transactions.
  - Filter by type (*All / Expenses / Income*), category, and sort by date or amount.
  - Real-time debounced search by note, category, or payment method.
- **🇮🇳 Indian Rupee (₹) & Multi-Currency Support**:
  - Indian numbering format (`en-IN` Lakhs & Crores e.g. `₹1,75,422.00`).
  - Switch on-the-fly between ₹ (INR), $ (USD), € (EUR), £ (GBP), ¥ (JPY), C$ (CAD), and A$ (AUD).
- **🌓 Theme & Aesthetics**:
  - Sleek dark theme with glowing gradients and glassmorphism.
  - Crisp light mode toggle.
  - Fully responsive across mobile phones, tablets, and desktops.
- **💾 Data Tools & Privacy**:
  - Export transactions to **CSV** (for Excel/Google Sheets) or **JSON**.
  - 1-click **JSON Backup & Restore**.
  - 1-click **Sample Data Loader** for demonstration.
  - File-based JSON database (`data/db.json`) ensuring 100% offline privacy and zero external database dependencies.

---

## 🛠️ Tech Stack

- **Backend**: Node.js (v18+ / v24), Express.js, CORS
- **Frontend**: Semantic HTML5, Vanilla CSS3 (Custom Glassmorphism Design System), Vanilla ES6+ JavaScript
- **Charts**: Chart.js 4.4
- **Icons & Fonts**: FontAwesome 6, Google Fonts (*Plus Jakarta Sans*)
- **Storage**: Safe atomic file-backed JSON database engine

---

## 🚀 Getting Started Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/Arvind920/Expanse-Tracker.git
   cd Expanse-Tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```
   *Or run with live watch reloading during development:*
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## ☁️ Deploying to Render

This application is ready for one-click deployment on [Render](https://render.com):

1. Create a new **Web Service** on Render.
2. Connect your GitHub repository (`Arvind920/Expanse-Tracker`).
3. Set configuration:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Click **Deploy Web Service**.

---

## 📁 Project Structure

```
├── data/
│   └── db.json               # Persistent database file
├── public/
│   ├── css/
│   │   ├── style.css         # Design system, glassmorphism, themes
│   │   └── responsive.css    # Mobile and tablet layouts
│   ├── js/
│   │   ├── api.js            # Client-side API service
│   │   ├── app.js            # App controller & UI interactions
│   │   └── charts.js         # Chart.js visualizations
│   └── index.html            # Main dashboard UI
├── src/
│   ├── routes/
│   │   ├── budgets.js        # Budget API routes
│   │   ├── dataManagement.js # Export, import, and seed routes
│   │   ├── goals.js          # Savings goals API routes
│   │   ├── stats.js          # Analytics and KPI stats routes
│   │   └── transactions.js   # Transaction CRUD routes
│   ├── services/
│   │   └── db.js             # Atomic database service
│   └── utils/
│       └── seedData.js       # Demo dataset generator
├── package.json              # Dependencies and scripts
├── server.js                 # Express server entry point
└── README.md
```

---

## 📄 License
ISC License. Feel free to use and customize for your personal finance tracking!
