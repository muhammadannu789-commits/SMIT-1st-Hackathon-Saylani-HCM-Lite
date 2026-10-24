# Saylani Hackathon 2026 — HCM Lite (Human Capital Management)

**Track:** Saylani Hackathon Beginner Track  
**Date:** 24 October 2026  
**Author:** Muhammad Anas  
**Project Type:** Client-Side Single Page Application (SPA) / Multi-Page Static HR Web App  
**No-Framework Compliance:** 100% Vanilla JavaScript, HTML5, CSS3, Bootstrap 5 CDN, Chart.js CDN, Browser `localStorage` (No Node.js, React, Vue, PHP, or backend servers).

---

## 1. Project Purpose & Overview

**HCM Lite** is a Human Capital Management web application engineered specifically for the **Saylani Hackathon Beginner Track (24 October 2026)**. It provides a complete, modern, beginner-friendly system for organizations to manage employees, record daily attendance with strict business rules (grace period, late check-in, half-day calculation), process leave requests with yearly quota deductions, compute monthly payroll with automated deductions, broadcast company announcements, and query data via an integrated local **Smart Helper** assistant.

All application states, user credentials, attendance rosters, leave balances, and company configurations persist client-side via the browser's `localStorage` API. The application starts clean with **zero hardcoded records**, allowing evaluators and administrators to experience the true first-run configuration wizard.

---

## 2. Technology Stack

- **Markup & Semantics:** HTML5 (semantic elements, responsive viewport, accessible form labels)
- **Styling & Layout:** CSS3 custom properties (design tokens, dark mode, printable A4 payslips) & **Bootstrap 5.3.3** via CDN
- **Icons:** **Bootstrap Icons 1.11.3** via CDN
- **Application Logic:** 100% Vanilla JavaScript (Modular ES6+ classes/objects, zero external build tools required)
- **Persistence Driver:** Browser `localStorage` (`hcm_company`, `hcm_users`, `hcm_attendance`, `hcm_leaves`, `hcm_session`, `hcm_announcements`, `hcm_activity`)
- **Data Visualizations:** **Chart.js v4.4** via CDN (Doughnut Department Distribution & 7-Day Attendance Trend bar chart)

---

## 3. Project Directory Structure

```text
SMIT Hackathon Anus/
├── css/
│   └── style.css            # Custom CSS: Modern dark navy sidebar, responsive grid, dark mode, print layout
├── js/
│   ├── storage.js           # Reusable localStorage abstraction with safe error handling & standard keys
│   ├── helper.js            # Date formatting, working days, currency, status badges, & Smart Helper chat
│   ├── auth.js              # Authentication, first-run wizard, route guards, password change, session
│   ├── employees.js         # Employee CRUD, inline field validation, search, filter, cascading deletion
│   ├── attendance.js        # Check-in, check-out, late status, half-day detection, CSV export, simulator
│   ├── leave.js             # Leave applications, quota balance, working-day calculation, approval/rejection
│   ├── settings.js          # Company settings (office hours, grace period, leave quota, working days)
│   ├── payslip.js           # Monthly payroll formula calculator, deduction engine, numbers-to-words converter
│   └── app.js               # Core orchestrator: theme toggling, mobile sidebar drawer, live clock, Smart Helper
├── index.html               # First-run setup wizard & Secure Login portal
├── admin.html               # Executive Admin Dashboard (KPIs, Charts, Roster, Announcements, Activity)
├── employees.html           # Admin Employee Management (Add, Edit, Delete, Search, Filter)
├── leaves.html              # Admin Leave Requests Management (Review, Approve, Reject with remarks)
├── settings.html            # Admin Company Settings & Factory Reset
├── employee.html            # Employee Portal (Check-in/out, Leave applications, Personal history)
├── payslip.html             # Printable monthly payslip with exact salary deductions & signature block
└── README.md                # Comprehensive documentation, testing walkthrough, and deployment guide
```

---

## 4. Key Business Rules & Formulas Implemented

### A. Attendance Rules
1. **One Record Per Day:** Each employee can have at most one attendance record per calendar date (`YYYY-MM-DD`).
2. **Duplicate Prevention:** A second check-in on the same day is strictly blocked.
3. **Check-out Sequence:** Check-out is permitted only after an active check-in has occurred.
4. **Late Arrival Detection:** If `Check-in Time > Office Start Time + Grace Minutes`, status is marked as **Late**; otherwise **Present**.
5. **Half-Day Rule:** If total work duration (`Check-out - Check-in`) is **less than 5.0 hours**, the attendance status is automatically updated to **Half Day**.
6. **Absenteeism:** Configured working days with no attendance record and no approved leave are counted as **Absent**. Non-working days (e.g., weekends) are never marked as absent.

### B. Leave Management Rules
1. **Date Validation:** Start date cannot be after end date.
2. **Working Days Only:** The system calculates duration by counting **only configured working days** (skipping weekends/off-days based on `hcm_company.workingDays`).
3. **No Overlaps:** Prevents overlapping leave requests with existing Pending or Approved requests.
4. **Yearly Quota Protection:** Approved leaves cannot exceed the configured yearly quota (`hcm_company.yearlyLeaveQuota`). Pending or rejected leaves are **not deducted** from the remaining balance.
5. **Admin Decision Comments:** Admin can approve or reject with custom feedback and remarks.

### C. Monthly Payslip Deduction Formula
Payslips are calculated strictly from actual attendance and leave records:

$$\text{Per-Day Salary} = \frac{\text{Monthly Salary}}{\text{Configured Working Days in Selected Month}}$$

$$\text{Deduction} = \text{Per-Day Salary} \times \left(\text{Absent Days} + 0.5 \times \text{Half Days}\right)$$

$$\text{Net Salary} = \max\left(0, \text{Monthly Salary} - \text{Deduction}\right)$$

- **Print Friendly:** Dedicated `@media print` formatting hides topbars, sidebars, buttons, and helper widgets, generating an invoice-grade payslip with company branding and signature blocks for printing or saving to PDF.

---

## 5. Smart Helper (Rule-Based AI Assistant)

Mounted on both Admin and Employee dashboards, the **Smart Helper** inspects real `localStorage` records in real time:

- **Admin Queries Supported:**
  - *"How many employees do we have?"* → Returns total active staff count.
  - *"Who is on leave today?"* → Lists employees with approved leaves covering today's date.
  - *"Who was late today?"* → Lists staff whose check-in exceeded office start time + grace period.
  - *"How many employees are present today?"* → Returns current checked-in count.
  - *"How many leave requests are pending?"* → Returns pending requests awaiting admin review.

- **Employee Queries Supported:**
  - *"How many leaves do I have left?"* → Returns quota, used days, and remaining balance.
  - *"Was I late today?"* → Checks logged-in employee's arrival time for today.
  - *"How many hours did I work this week?"* → Aggregates total completed shift hours for the current week.
  - *"What is my attendance today?"* → Details check-in time, check-out status, and hours worked.

- **Strict Privacy Barrier:** Employees cannot query another employee's salary, records, or personal data. Friendly suggestion chips and fallback instructions are provided.

---

## 6. How to Run the Application Locally

Because HCM Lite uses standard HTML5, CSS3, and JavaScript with CDN dependencies:

### Option 1: Direct Browser Launch
1. Navigate to the project directory on your computer:
   `C:\Users\Anas\OneDrive\Desktop\SMIT Hackathon Anus`
2. Double-click **`index.html`** to open it in Google Chrome, Microsoft Edge, Mozilla Firefox, or Brave.

### Option 2: VS Code Live Server
1. Open the project folder in **Visual Studio Code**.
2. Right-click **`index.html`** and select **"Open with Live Server"**.
3. The app will open at `http://127.0.0.1:5500/index.html`.

### Option 3: Any Lightweight HTTP Server
If using Python (optional):
```bash
python -m http.server 8000
```
Open `http://localhost:8000` in your web browser.

---

## 7. Step-by-Step Testing & Evaluation Guide

### Step 1: First-Run Setup
1. Open `index.html`. Because the app starts clean with no data, you will see the **"Company Setup"** screen.
2. Enter:
   - **Company Name:** `Saylani Tech Ltd.`
   - **Admin Name:** `Muhammad Anas`
   - **Admin Email:** `admin@saylani.com`
   - **Admin Password:** `admin123`
   - **Confirm Password:** `admin123`
3. Click **"Initialize Company & Admin"**.
4. You will be logged in immediately and redirected to `admin.html`.

### Step 2: Configure Company Settings
1. Navigate to **Company Settings** (`settings.html`) via the sidebar.
2. Verify or customize:
   - **Office Start Time:** `09:00`
   - **Grace Minutes:** `15`
   - **Yearly Leave Quota:** `20`
   - **Working Days:** Check Monday through Friday.
3. Click **"Save Changes"**. Settings persist across refreshes.

### Step 3: Add Employees & Test Role Creation
1. Go to **Employees** (`employees.html`).
2. Click **"Add Employee"**.
3. Create Employee 1:
   - **Name:** `Ayesha Khan`
   - **Email:** `ayesha@saylani.com`
   - **Password:** `emp123`
   - **Department:** `Engineering`
   - **Monthly Salary:** `90000`
4. Click **"Save Employee"**. An active account is automatically provisioned.
5. Create Employee 2:
   - **Name:** `Bilal Ahmed`
   - **Email:** `bilal@saylani.com`
   - **Password:** `emp123`
   - **Department:** `Marketing`
   - **Monthly Salary:** `75000`
6. Test search and department filtering by typing in the search box or selecting "Engineering".

### Step 4: Test Employee Portal & Attendance
1. Click the user menu at the bottom-left of the sidebar and select **"Sign Out"**.
2. On `index.html`, sign in as an employee:
   - **Email:** `ayesha@saylani.com`
   - **Password:** `emp123`
3. You will be redirected to the **Employee Portal** (`employee.html`).
4. Click **"Check In"**. Notice:
   - Today's attendance status updates to **Present** (or **Late** if after 09:15).
   - "Check In" button is now disabled (preventing double check-ins).
   - "Check Out" button becomes enabled.
5. Click **"Check Out"**.
   - If checked out in under 5 hours, the status updates to **Half Day**.
   - Both buttons become disabled for today with a completion message.
6. Check your attendance history table at the bottom of the dashboard.

### Step 5: Test Leave Application & Quota Balance
1. On `employee.html`, click **"Apply for Leave"**.
2. Select:
   - **Leave Type:** `Annual Leave`
   - **Start Date:** `2026-10-26` (Monday)
   - **End Date:** `2026-10-27` (Tuesday)
   - **Reason:** `Family wedding event`
3. Notice the live counter shows: *"Working days counted: 2 day(s)"*.
4. Click **"Submit Leave Request"**.
5. Sign out and log back in as **Admin** (`admin@saylani.com` / `admin123`).
6. Navigate to **Leave Requests** (`leaves.html`).
7. Click **"Approve"**, write an optional remark (e.g., *"Approved, enjoy your time!"*), and confirm.
8. The request status changes to **Approved**, and the employee's balance is deducted.

### Step 6: Test Monthly Payslip Calculation & Printing
1. Go to **Monthly Payslips** (`payslip.html`).
2. Select `Ayesha Khan` and the month `2026-10`.
3. Click **"Calculate"**.
4. Observe the exact formula execution:
   - Total Working Days in October 2026 (Mon-Fri): 22 days.
   - Per-day Salary: $90,000 / 22 = PKR 4,090.91$.
   - Any absent or half-day penalties are calculated and displayed line-by-line.
   - Net salary is calculated and formatted in both currency and words (*"Ninety Thousand Rupees Only"*).
5. Click **"Print / Save as PDF"** to preview the clean, borderless printed receipt.

### Step 7: Test the Smart Helper Assistant
1. Click the blue robot icon at the bottom-right on either the Admin or Employee dashboard.
2. As Admin, ask:
   - *"How many employees do we have?"*
   - *"Who is on leave today?"*
   - *"How many leave requests are pending?"*
3. Sign in as Employee and ask:
   - *"How many leaves do I have left?"*
   - *"Was I late today?"*
   - *"What is my attendance today?"*
4. All responses calculate live from the stored records!

---

## 8. Important Limitations of Browser-Only `localStorage`

Because this is a zero-backend educational submission for the Beginner Track:
1. **Device & Browser Scoped:** Data stored in `localStorage` is saved locally in that specific browser profile. It does not sync across different browsers or computers.
2. **Demonstration Authentication:** Passwords are stored in client-side storage for role simulation and judging demonstration. In a production environment, authentication requires secure HTTP-only cookies, salted hashing (e.g. bcrypt), and server-side authorization tokens.
3. **Storage Quota:** Browser `localStorage` typically has a storage ceiling of 5MB–10MB, which is plenty for thousands of HCM records, but not for multi-gigabyte enterprise file attachments.

---

## 9. Deployment Instructions (Static Hosting)

Because HCM Lite contains no server code or build scripts, it can be deployed to any free static host in under 2 minutes:

### Deploying to GitHub Pages
1. Initialize a git repository and push the project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of HCM Lite"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. On GitHub, navigate to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **Deploy from a branch**.
4. Set the branch to `main` and folder to `/ (root)`, then click **Save**.
5. Your app will be live at `https://<your-username>.github.io/<repo-name>/`.

### Deploying to Netlify
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop the `SMIT Hackathon Anus` folder into the browser window.
3. Your live link is generated instantly.

### Deploying to Vercel
1. Install Vercel CLI: `npm i -g vercel` (or link your GitHub repo at vercel.com).
2. Run `vercel --prod` inside the project folder.

---

## 10. Saylani LMS Submission Checklist

- [x] Functional First-run setup and Admin account creation
- [x] Secure login with role separation (`Admin` vs. `Employee`)
- [x] Role-based page protection and redirection
- [x] Dynamic Admin Dashboard (KPIs, Department distribution, 7-day attendance trend)
- [x] Full Employee CRUD with inline field validations & cascading deletion
- [x] Company settings management (Office start time, grace period, leave quota, working days)
- [x] Attendance check-in/out with Late arrival and Half-Day (< 5 hrs) business rules
- [x] Leave application with weekend skipping, overlap checks, and quota deductions
- [x] Monthly payslip calculator using exact formula: $\text{Net} = \text{Salary} - \text{PerDay} \times (\text{Absent} + 0.5 \times \text{HalfDays})$
- [x] Print / Save as PDF layout for payslips
- [x] Keyword-based Smart Helper AI assistant for Admin and Employee
- [x] Company announcements broadcast
- [x] Modern dark navy theme with responsive mobile sidebar drawer
- [x] Bonus: CSV Attendance export, Dark Mode toggle, Manual Attendance simulator for evaluators
- [x] Pure client-side static code ready for GitHub Pages submission
