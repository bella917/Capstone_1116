# TaskSync Employee Management System (Node.js)

TaskSync is a full-stack Employee Management System built with **Node.js** and **Express**. It uses the provided `login.html`, `administrator.html`, `manager.html`, and `employee.html` templates as the front-end and persists all organizational data in a local JSON database (`data/db.json`).

*Note: Per system requirements, payroll and compensation management are completely excluded from this system.*

## Project Directory Structure

Make sure your project folder is organized as follows:

```
tasksync-ems/
├── package.json
├── server.js
├── README.md
├── data/
│   └── db.json
└── public/
    ├── client.js
    ├── login.html
    ├── administrator.html
    ├── manager.html
    ├── employee.html
    └── TaskSync Blue Gradient Logo.png

```

## Prerequisites

* **Node.js** (v18.0.0 or higher recommended)

* **npm** (comes bundled with Node.js)

To verify Node.js and npm are installed on your computer, run:

```
node -v
npm -v

```

## How to Run the Program

1. **Open a terminal** in the root project directory (`tasksync-ems/`).

2. **Install the dependencies** (Express):

   ```
   npm install
   
   ```

3. **Start the server:**

   ```
   npm start
   
   ```

   *(Or run `node server.js` directly.)*

4. **Access the application in your web browser:**
   Open <http://localhost:3000>

## Account Usernames & Passwords

You can log in using either the **Username** or **Email** listed below:

| Role | Full Name | Username | Email | Password | Portal Redirect | 
| ----- | ----- | ----- | ----- | ----- | ----- | 
| **Administrator** | Alex Morgan | `admin` | `admin@tasksync.com` | `admin123` | `administrator.html` | 
| **Manager** | Jordan Taylor | `manager` | `manager@tasksync.com` | `manager123` | `manager.html` | 
| **Employee (Default)** | Taylor Reed | `employee` | `employee@tasksync.com` | `employee123` | `employee.html` | 
| **Employee** | Samira Chen | `schen` | `schen@tasksync.com` | `password123` | `employee.html` | 
| **Employee** | Marcus Ross | `mross` | `mross@tasksync.com` | `password123` | `employee.html` | 

### Creating New Accounts

Administrators and Managers can onboard new employees from the **My Team** tab by filling out the **Add Employee** form (including a custom username and password). Once added, that employee can immediately log in at `http://localhost:3000` using their new credentials.

## Features by Portal

### 1. Administrator Portal (`administrator.html`)

* **Dashboard:** Real-time notifications for pending LOA requests, performance evaluations, and daily attendance counts.

* **Assignments:** Create, assign, update progress on, and delete employee tasks.

* **My Team & Employee Details:** Add or remove employees, inspect full employee profiles, and assign custom shift schedules.

* **LOA Requests:** Review employee Leave of Absence requests and **Accept** (automatically deducts PTO balance), **Deny**, or **Request More Information**.

* **Attendance:** View daily clock-in/out logs, overtime hours, and manually mark employees as *Present*, *Late / Tardy*, or *On Leave*.

* **Performance Review:** Complete manager evaluations and assign final ratings (`1.0` – `5.0`).

* **Reports:** Generate live Employee, Attendance, Performance, and Leave reports, and export any generated report to **CSV**.

* **Chat, Profile & Settings:** Direct message any manager or employee and update account settings.

### 2. Manager Portal (`manager.html`)

* Includes full team management capabilities across **Dashboard**, **Assignments**, **My Team**, **Employee Details & Shift Scheduling**, **LOA Requests**, **Attendance**, **Performance Review**, **Chat**, **Profile**, and **Settings**.

### 3. Employee Portal (`employee.html`)

* **Dashboard:** View shift reminders, active assignment counts, and perform daily **Clock In** and **Clock Out** actions.

* **Assignments:** View assigned tasks, due dates, priority badges, and update completion percentages using interactive sliders.

* **Schedule & LOA:** Browse monthly shift calendars, check available PTO balance, and submit new Leave of Absence requests.

* **Progress & Self-Review:** Track overall task completion and submit Q4 self-review evaluations.

* **Chat, Profile & Settings:** Send messages to managers or administrators, view message history, and update personal profile details.