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

## Security and Permissions (added Nov 3)

* **Sessions:** logging in sets an HttpOnly session cookie (8 hours). Every API route checks it. Logout ends the session on the server.
* **Roles:** employees only receive their own tasks, schedule, leave, attendance, reviews and messages. Managers and admins manage the team. Only admins can remove employees, create manager/admin accounts, change roles, reset other people's passwords and generate reports.
* **Passwords:** stored hashed (scrypt) in `data/db.json`. Existing plain-text passwords are converted automatically the first time the server starts. The demo logins in the table above are unchanged.
* **Locked down files:** only the contents of `public/` and the logo are served. `data/`, `server.js` and `package.json` can no longer be downloaded.
* **Brute force:** 5 wrong passwords in a row locks that login for 1 minute.
* **Input:** text is cleaned before it is stored, dates, ratings, progress (0-100) and priorities are validated, and an employee can only change the progress of their own tasks.
* **Task status:** `Not Started` (0%), `In Progress` (1-99%), `Completed` (100%). It is calculated from progress.
* **Assigning tasks:** managers and admins can assign from the Assignments tab, or from My Team > View Details > Assign a Task.

## Schedules, Messages and Reviews (added Nov 6)

* **Shifts:** managers and admins add and remove shifts from My Team > View Details. Shifts are checked (valid date, hours up to 50 characters, note up to 120, no exact duplicates) and employees see them, sorted by date, on their Schedule page and calendar. Past shifts are marked Past.
* **Messages:** employees pick a manager or admin from a suggestion list (every manager and admin is listed). The sender is always the logged-in person. Messages are up to 1,500 characters, show a date and time, and are visible only to the two people in the conversation.
* **Performance reviews:** managers and admins write the manager feedback and the 1.0 to 5.0 rating (My Team > Performance Review). Employees write their own self review and read the manager feedback and rating on their Progress page. Review text is limited to 600 characters. A wrong value shows an error message instead of failing silently.
* **Live refresh:** each portal checks the server every 8 seconds. New tasks, shifts, messages, reviews and status changes appear without reloading. It never refreshes while someone is typing, so an unfinished message or form is not lost, and it shows a short "New message from ..." notice.
* **Dates:** "today" now uses the local time zone instead of UTC. Before, anything done after 7 PM Eastern was filed under tomorrow's date (clock-ins, new tasks, default dates).
* **Layout fix:** `manager.html` had one stray closing tag in the dashboard section that pushed the dashboard cards outside the page content on every manager screen. It is removed.
* **Tests:** with the server running on fresh data, `node tests/suite.js` and `node tests/flows.js` run 263 checks in total (see `tests/README.txt`).
