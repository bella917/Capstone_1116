const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.json());

// Ensure data directory exists and initialize seed database if not present
function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const todayStr = new Date().toISOString().split('T')[0];
    const initialData = {
      users: [
        {
          id: 'u-admin',
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          name: 'Alex Morgan',
          email: 'admin@tasksync.com',
          phone: '555-010-1000',
          department: 'Operations & HR',
          position: 'Administrator',
          workType: 'Full-Time (On-Site)',
          birthday: '1986-04-12',
          joinDate: '2020-01-15',
          ptoAvailable: 20,
          shift: '08:30 AM - 05:00 PM',
          workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        },
        {
          id: 'u-manager',
          username: 'manager',
          password: 'manager123',
          role: 'manager',
          name: 'Jordan Taylor',
          email: 'manager@tasksync.com',
          phone: '555-010-2000',
          department: 'Engineering',
          position: 'Engineering Manager',
          workType: 'Full-Time (Hybrid)',
          birthday: '1989-08-22',
          joinDate: '2021-03-10',
          ptoAvailable: 18,
          shift: '09:00 AM - 05:30 PM',
          workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        },
        {
          id: 'u-emp1',
          username: 'employee',
          password: 'employee123',
          role: 'employee',
          name: 'Taylor Reed',
          email: 'employee@tasksync.com',
          phone: '555-010-3001',
          department: 'Engineering',
          position: 'Software Developer',
          workType: 'Full-Time (Hybrid)',
          birthday: '1996-11-05',
          joinDate: '2023-06-01',
          ptoAvailable: 14,
          shift: '09:00 AM - 05:00 PM',
          workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        },
        {
          id: 'u-emp2',
          username: 'schen',
          password: 'password123',
          role: 'employee',
          name: 'Samira Chen',
          email: 'schen@tasksync.com',
          phone: '555-010-3002',
          department: 'Product Design',
          position: 'UX Designer',
          workType: 'Full-Time (Remote)',
          birthday: '1994-02-19',
          joinDate: '2022-09-12',
          ptoAvailable: 12,
          shift: '09:30 AM - 05:30 PM',
          workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        },
        {
          id: 'u-emp3',
          username: 'mross',
          password: 'password123',
          role: 'employee',
          name: 'Marcus Ross',
          email: 'mross@tasksync.com',
          phone: '555-010-3003',
          department: 'Quality Assurance',
          position: 'QA Analyst',
          workType: 'Full-Time (On-Site)',
          birthday: '1998-07-30',
          joinDate: '2024-01-20',
          ptoAvailable: 10,
          shift: '08:00 AM - 04:30 PM',
          workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        }
      ],
      assignments: [
        {
          id: 'asg-1',
          title: 'Q4 API Security Audit',
          description: 'Review authentication endpoints and session validation rules.',
          employeeId: 'u-emp1',
          assignedBy: 'Jordan Taylor',
          dueDate: '2026-11-15',
          priority: 'High',
          progress: 65,
          status: 'In Progress',
          createdAt: todayStr
        },
        {
          id: 'asg-2',
          title: 'Update Onboarding Documentation',
          description: 'Standardize setup instructions for new engineering hires.',
          employeeId: 'u-emp1',
          assignedBy: 'Jordan Taylor',
          dueDate: '2026-11-10',
          priority: 'Medium',
          progress: 100,
          status: 'Completed',
          createdAt: todayStr
        },
        {
          id: 'asg-3',
          title: 'Mobile Dashboard Wireframes',
          description: 'Deliver responsive component specs for the employee portal.',
          employeeId: 'u-emp2',
          assignedBy: 'Jordan Taylor',
          dueDate: '2026-11-18',
          priority: 'High',
          progress: 40,
          status: 'In Progress',
          createdAt: todayStr
        },
        {
          id: 'asg-4',
          title: 'Automated Regression Suite',
          description: 'Add end-to-end tests for attendance and schedule modules.',
          employeeId: 'u-emp3',
          assignedBy: 'Alex Morgan',
          dueDate: '2026-11-22',
          priority: 'Medium',
          progress: 20,
          status: 'In Progress',
          createdAt: todayStr
        }
      ],
      schedules: [
        {
          id: 'sch-1',
          employeeId: 'u-emp1',
          date: todayStr,
          shift: '09:00 AM - 05:00 PM',
          note: 'Core Sprint Development & Daily Standup'
        },
        {
          id: 'sch-2',
          employeeId: 'u-emp2',
          date: todayStr,
          shift: '09:30 AM - 05:30 PM',
          note: 'UX Design Review Session'
        },
        {
          id: 'sch-3',
          employeeId: 'u-emp3',
          date: todayStr,
          shift: '08:00 AM - 04:30 PM',
          note: 'Release Candidate Testing'
        }
      ],
      loaRequests: [
        {
          id: 'loa-1',
          employeeId: 'u-emp1',
          dateReceived: todayStr,
          startDate: '2026-11-24',
          endDate: '2026-11-26',
          daysRequested: 3,
          reason: 'Family holiday travel out of state.',
          previousRequests: 1,
          status: 'Pending',
          managerNote: ''
        },
        {
          id: 'loa-2',
          employeeId: 'u-emp2',
          dateReceived: todayStr,
          startDate: '2026-12-03',
          endDate: '2026-12-04',
          daysRequested: 2,
          reason: 'Medical appointment and recovery day.',
          previousRequests: 0,
          status: 'Pending',
          managerNote: ''
        }
      ],
      attendance: [
        {
          id: 'att-1',
          employeeId: 'u-emp1',
          date: todayStr,
          clockIn: '08:55 AM',
          clockOut: '05:10 PM',
          totalHours: 8.25,
          overtimeHours: 0.25,
          status: 'Present'
        },
        {
          id: 'att-2',
          employeeId: 'u-emp2',
          date: todayStr,
          clockIn: '09:48 AM',
          clockOut: '--',
          totalHours: 0,
          overtimeHours: 0,
          status: 'Late / Tardy'
        },
        {
          id: 'att-3',
          employeeId: 'u-emp3',
          date: todayStr,
          clockIn: '07:58 AM',
          clockOut: '05:30 PM',
          totalHours: 9.5,
          overtimeHours: 1.5,
          status: 'Present'
        }
      ],
      performanceReviews: [
        {
          id: 'perf-1',
          employeeId: 'u-emp1',
          cycle: 'Q4 2026',
          selfReview: 'Completed (4.5/5) - Delivered API enhancements and docs ahead of schedule.',
          managerReview: 'Completed - Strong technical execution and mentorship.',
          finalRating: 4.6,
          goalsMetRate: 92,
          status: 'Completed'
        },
        {
          id: 'perf-2',
          employeeId: 'u-emp2',
          cycle: 'Q4 2026',
          selfReview: 'Completed (4.3/5) - Redesigned core navigation and component library.',
          managerReview: 'Draft Pending',
          finalRating: null,
          goalsMetRate: 85,
          status: 'Pending Draft'
        },
        {
          id: 'perf-3',
          employeeId: 'u-emp3',
          cycle: 'Q4 2026',
          selfReview: 'Pending Submission',
          managerReview: 'Draft Pending',
          finalRating: null,
          goalsMetRate: 78,
          status: 'Pending Draft'
        }
      ],
      reports: [
        {
          id: 'rep-1',
          name: 'Workforce Directory & Department Breakdown',
          type: 'Employee Report',
          dateGenerated: todayStr,
          status: 'Completed',
          summary: '3 Active Employees, 1 Manager, 1 Admin across 4 departments.'
        },
        {
          id: 'rep-2',
          name: 'Daily Attendance & Overtime Summary',
          type: 'Attendance Report',
          dateGenerated: todayStr,
          status: 'Completed',
          summary: '2 Present on time, 1 Late/Tardy, 1.75 Total Overtime Hours.'
        }
      ],
      messages: [
        {
          id: 'msg-1',
          senderId: 'u-manager',
          senderName: 'Jordan Taylor',
          senderEmail: 'manager@tasksync.com',
          recipientId: 'u-emp1',
          recipientName: 'Taylor Reed',
          recipientEmail: 'employee@tasksync.com',
          text: 'Hi Taylor, great progress on the onboarding documentation! Let me know if you need anything for the Q4 API audit.',
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
        },
        {
          id: 'msg-2',
          senderId: 'u-emp1',
          senderName: 'Taylor Reed',
          senderEmail: 'employee@tasksync.com',
          recipientId: 'u-manager',
          recipientName: 'Jordan Taylor',
          recipientEmail: 'manager@tasksync.com',
          text: 'Thanks Jordan! I am 65% through the API audit and on track for the due date.',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'msg-3',
          senderId: 'u-admin',
          senderName: 'Alex Morgan',
          senderEmail: 'admin@tasksync.com',
          recipientId: 'u-manager',
          recipientName: 'Jordan Taylor',
          recipientEmail: 'manager@tasksync.com',
          text: 'Hi Jordan, please review the pending Q4 performance drafts and LOA requests by Friday.',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    };

    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readDB() {
  initDatabase();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function sanitizeUser(u) {
  if (!u) return null;
  const { password, ...safe } = u;
  return safe;
}

// ==================== API ROUTES ====================

// 1. Authentication
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find(
    (u) =>
      (u.username.toLowerCase() === String(username || '').toLowerCase() ||
        u.email.toLowerCase() === String(username || '').toLowerCase()) &&
      u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  let redirect = 'employee.html';
  if (user.role === 'admin') redirect = 'administrator.html';
  else if (user.role === 'manager') redirect = 'manager.html';

  res.json({ user: sanitizeUser(user), redirect });
});

// 2. Full State Bootstrap (returns all non-payroll EMS state)
app.get('/api/bootstrap', (req, res) => {
  const db = readDB();
  const users = db.users.map(sanitizeUser);
  res.json({
    users,
    assignments: db.assignments,
    schedules: db.schedules,
    loaRequests: db.loaRequests,
    attendance: db.attendance,
    performanceReviews: db.performanceReviews,
    reports: db.reports,
    messages: db.messages
  });
});

// 3. Employees / Users CRUD
app.post('/api/employees', (req, res) => {
  const db = readDB();
  const {
    name,
    username,
    password,
    email,
    phone,
    department,
    position,
    role,
    workType,
    birthday,
    joinDate,
    shift,
    ptoAvailable
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const cleanUsername =
    (username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (db.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return res.status(400).json({ error: 'Username already exists.' });
  }

  const newUser = {
    id: 'u-' + Date.now(),
    username: cleanUsername,
    password: password || 'employee123',
    role: role || 'employee',
    name,
    email,
    phone: phone || '555-010-0000',
    department: department || 'General',
    position: position || 'Associate',
    workType: workType || 'Full-Time (On-Site)',
    birthday: birthday || '1995-01-01',
    joinDate: joinDate || new Date().toISOString().split('T')[0],
    ptoAvailable: Number(ptoAvailable ?? 15),
    shift: shift || '09:00 AM - 05:00 PM',
    workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  };

  db.users.push(newUser);

  // Create initial performance review entry for employees
  if (newUser.role === 'employee') {
    db.performanceReviews.push({
      id: 'perf-' + Date.now(),
      employeeId: newUser.id,
      cycle: 'Q4 2026',
      selfReview: 'Pending Submission',
      managerReview: 'Draft Pending',
      finalRating: null,
      goalsMetRate: 0,
      status: 'Pending Draft'
    });
  }

  writeDB(db);
  res.status(201).json(sanitizeUser(newUser));
});

app.put('/api/employees/:id', (req, res) => {
  const db = readDB();
  const idx = db.users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found.' });

  const updated = { ...db.users[idx], ...req.body };
  if (!req.body.password) {
    updated.password = db.users[idx].password;
  }
  db.users[idx] = updated;
  writeDB(db);
  res.json(sanitizeUser(updated));
});

app.delete('/api/employees/:id', (req, res) => {
  const db = readDB();
  db.users = db.users.filter((u) => u.id !== req.params.id);
  db.assignments = db.assignments.filter((a) => a.employeeId !== req.params.id);
  db.schedules = db.schedules.filter((s) => s.employeeId !== req.params.id);
  db.loaRequests = db.loaRequests.filter((l) => l.employeeId !== req.params.id);
  db.attendance = db.attendance.filter((a) => a.employeeId !== req.params.id);
  db.performanceReviews = db.performanceReviews.filter(
    (p) => p.employeeId !== req.params.id
  );
  writeDB(db);
  res.json({ success: true });
});

// 4. Assignments CRUD
app.post('/api/assignments', (req, res) => {
  const db = readDB();
  const { title, description, employeeId, assignedBy, dueDate, priority } = req.body;
  if (!title || !employeeId) {
    return res.status(400).json({ error: 'Title and employee are required.' });
  }

  const newAsg = {
    id: 'asg-' + Date.now(),
    title,
    description: description || '',
    employeeId,
    assignedBy: assignedBy || 'Management',
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    priority: priority || 'Medium',
    progress: 0,
    status: 'Pending',
    createdAt: new Date().toISOString().split('T')[0]
  };

  db.assignments.push(newAsg);
  writeDB(db);
  res.status(201).json(newAsg);
});

app.put('/api/assignments/:id', (req, res) => {
  const db = readDB();
  const idx = db.assignments.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Assignment not found.' });

  const progress =
    req.body.progress !== undefined
      ? Math.max(0, Math.min(100, Number(req.body.progress)))
      : db.assignments[idx].progress;

  let status = req.body.status || db.assignments[idx].status;
  if (progress === 100) status = 'Completed';
  else if (progress > 0) status = 'In Progress';
  else status = 'Pending';

  db.assignments[idx] = {
    ...db.assignments[idx],
    ...req.body,
    progress,
    status
  };

  writeDB(db);
  res.json(db.assignments[idx]);
});

app.delete('/api/assignments/:id', (req, res) => {
  const db = readDB();
  db.assignments = db.assignments.filter((a) => a.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// 5. Schedules CRUD
app.post('/api/schedules', (req, res) => {
  const db = readDB();
  const { employeeId, date, shift, note } = req.body;
  if (!employeeId || !date || !shift) {
    return res.status(400).json({ error: 'Employee, date, and shift are required.' });
  }

  const newSched = {
    id: 'sch-' + Date.now(),
    employeeId,
    date,
    shift,
    note: note || 'Scheduled Shift'
  };

  db.schedules.push(newSched);
  writeDB(db);
  res.status(201).json(newSched);
});

app.delete('/api/schedules/:id', (req, res) => {
  const db = readDB();
  db.schedules = db.schedules.filter((s) => s.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// 6. LOA Requests CRUD
app.post('/api/loa', (req, res) => {
  const db = readDB();
  const { employeeId, startDate, endDate, daysRequested, reason } = req.body;
  if (!employeeId || !startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'All leave fields are required.' });
  }

  const prevCount = db.loaRequests.filter((r) => r.employeeId === employeeId).length;
  const newLoa = {
    id: 'loa-' + Date.now(),
    employeeId,
    dateReceived: new Date().toISOString().split('T')[0],
    startDate,
    endDate,
    daysRequested: Number(daysRequested) || 1,
    reason,
    previousRequests: prevCount,
    status: 'Pending',
    managerNote: ''
  };

  db.loaRequests.unshift(newLoa);
  writeDB(db);
  res.status(201).json(newLoa);
});

app.put('/api/loa/:id', (req, res) => {
  const db = readDB();
  const idx = db.loaRequests.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'LOA request not found.' });

  const prevStatus = db.loaRequests[idx].status;
  const nextStatus = req.body.status || prevStatus;

  db.loaRequests[idx] = {
    ...db.loaRequests[idx],
    ...req.body
  };

  // Deduct PTO days when transitioning to Approved
  if (prevStatus !== 'Approved' && nextStatus === 'Approved') {
    const uIdx = db.users.findIndex((u) => u.id === db.loaRequests[idx].employeeId);
    if (uIdx !== -1) {
      db.users[uIdx].ptoAvailable = Math.max(
        0,
        (db.users[uIdx].ptoAvailable || 0) - (db.loaRequests[idx].daysRequested || 1)
      );
    }
  }

  writeDB(db);
  res.json(db.loaRequests[idx]);
});

// 7. Attendance Clock-In / Clock-Out & Manual Log Update
app.post('/api/attendance', (req, res) => {
  const db = readDB();
  const { employeeId, action, clockIn, clockOut, totalHours, overtimeHours, status } =
    req.body;
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  let record = db.attendance.find(
    (a) => a.employeeId === employeeId && a.date === todayStr
  );

  if (action === 'clock-in') {
    if (!record) {
      const hour = new Date().getHours();
      const autoStatus = hour >= 9 ? 'Late / Tardy' : 'Present';
      record = {
        id: 'att-' + Date.now(),
        employeeId,
        date: todayStr,
        clockIn: nowTime,
        clockOut: '--',
        totalHours: 0,
        overtimeHours: 0,
        status: autoStatus
      };
      db.attendance.push(record);
    } else {
      record.clockIn = nowTime;
    }
  } else if (action === 'clock-out') {
    if (!record) {
      record = {
        id: 'att-' + Date.now(),
        employeeId,
        date: todayStr,
        clockIn: '09:00 AM',
        clockOut: nowTime,
        totalHours: 8,
        overtimeHours: 0,
        status: 'Present'
      };
      db.attendance.push(record);
    } else {
      record.clockOut = nowTime;
      record.totalHours = record.totalHours > 0 ? record.totalHours : 8.0;
    }
  } else {
    // Admin / Manager manual create or update
    if (!record) {
      record = {
        id: 'att-' + Date.now(),
        employeeId,
        date: todayStr,
        clockIn: clockIn || '09:00 AM',
        clockOut: clockOut || '--',
        totalHours: Number(totalHours || 0),
        overtimeHours: Number(overtimeHours || 0),
        status: status || 'Present'
      };
      db.attendance.push(record);
    } else {
      if (clockIn !== undefined) record.clockIn = clockIn;
      if (clockOut !== undefined) record.clockOut = clockOut;
      if (totalHours !== undefined) record.totalHours = Number(totalHours);
      if (overtimeHours !== undefined) record.overtimeHours = Number(overtimeHours);
      if (status !== undefined) record.status = status;
    }
  }

  writeDB(db);
  res.json(record);
});

// 8. Performance Reviews Update
app.put('/api/performance/:employeeId', (req, res) => {
  const db = readDB();
  let record = db.performanceReviews.find(
    (p) => p.employeeId === req.params.employeeId
  );

  if (!record) {
    record = {
      id: 'perf-' + Date.now(),
      employeeId: req.params.employeeId,
      cycle: 'Q4 2026',
      selfReview: 'Pending Submission',
      managerReview: 'Draft Pending',
      finalRating: null,
      goalsMetRate: 0,
      status: 'Pending Draft'
    };
    db.performanceReviews.push(record);
  }

  if (req.body.selfReview !== undefined) record.selfReview = req.body.selfReview;
  if (req.body.managerReview !== undefined) record.managerReview = req.body.managerReview;
  if (req.body.finalRating !== undefined) {
    record.finalRating =
      req.body.finalRating === '' || req.body.finalRating === null
        ? null
        : Number(req.body.finalRating);
  }
  if (req.body.goalsMetRate !== undefined) {
    record.goalsMetRate = Number(req.body.goalsMetRate);
  }
  record.status = record.finalRating ? 'Completed' : 'Pending Draft';

  writeDB(db);
  res.json(record);
});

// 9. Reports Generation & Deletion
app.post('/api/reports', (req, res) => {
  const db = readDB();
  const { type, name } = req.body;
  const todayStr = new Date().toISOString().split('T')[0];

  const employees = db.users.filter((u) => u.role === 'employee');
  let summary = '';

  if (type === 'Employee Report') {
    const depts = [...new Set(employees.map((e) => e.department))];
    summary = `${employees.length} active employees across ${depts.length} departments (${depts.join(', ')}).`;
  } else if (type === 'Attendance Report') {
    const present = db.attendance.filter((a) => a.status === 'Present').length;
    const late = db.attendance.filter((a) => a.status === 'Late / Tardy').length;
    const ot = db.attendance.reduce((sum, a) => sum + Number(a.overtimeHours || 0), 0);
    summary = `Present: ${present}, Late/Tardy: ${late}, Total Overtime: ${ot.toFixed(1)} hrs.`;
  } else if (type === 'Performance Report') {
    const rated = db.performanceReviews.filter((p) => p.finalRating !== null);
    const avg =
      rated.length > 0
        ? (rated.reduce((s, p) => s + p.finalRating, 0) / rated.length).toFixed(2)
        : 'N/A';
    summary = `${rated.length}/${db.performanceReviews.length} evaluations finalized. Average Rating: ${avg}/5.0.`;
  } else if (type === 'Leave Report') {
    const pending = db.loaRequests.filter((l) => l.status === 'Pending').length;
    const approved = db.loaRequests.filter((l) => l.status === 'Approved').length;
    summary = `${db.loaRequests.length} total requests (${pending} Pending, ${approved} Approved).`;
  } else {
    summary = 'Organization operational report generated.';
  }

  const newReport = {
    id: 'rep-' + Date.now(),
    name: name || `${type} (${todayStr})`,
    type: type || 'General Report',
    dateGenerated: todayStr,
    status: 'Completed',
    summary
  };

  db.reports.unshift(newReport);
  writeDB(db);
  res.status(201).json(newReport);
});

app.delete('/api/reports/:id', (req, res) => {
  const db = readDB();
  db.reports = db.reports.filter((r) => r.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// 10. Chat / Messaging
app.post('/api/messages', (req, res) => {
  const db = readDB();
  const { senderId, senderName, senderEmail, recipientEmail, recipientId, text } =
    req.body;

  if (!text) return res.status(400).json({ error: 'Message text is required.' });

  const sender =
    db.users.find((u) => u.id === senderId) ||
    db.users.find(
      (u) => u.email.toLowerCase() === String(senderEmail || '').toLowerCase()
    );

  const recipient =
    db.users.find((u) => u.id === recipientId) ||
    db.users.find(
      (u) => u.email.toLowerCase() === String(recipientEmail || '').toLowerCase()
    );

  if (!recipient) {
    return res
      .status(404)
      .json({ error: `No user found with email ${recipientEmail}.` });
  }

  const msg = {
    id: 'msg-' + Date.now(),
    senderId: sender ? sender.id : 'guest',
    senderName: sender ? sender.name : senderName || 'User',
    senderEmail: sender ? sender.email : senderEmail || '',
    recipientId: recipient.id,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    text,
    timestamp: new Date().toISOString()
  };

  db.messages.push(msg);
  writeDB(db);
  res.status(201).json(msg);
});

// ==================== FRONT-END HTML & ASSET SERVING ====================

function resolveAssetPath(filename) {
  const inPublic = path.join(PUBLIC_DIR, filename);
  if (fs.existsSync(inPublic)) return inPublic;
  const inRoot = path.join(__dirname, filename);
  if (fs.existsSync(inRoot)) return inRoot;
  return null;
}

function serveHtmlWithClientScript(res, filename) {
  const filePath = resolveAssetPath(filename);
  if (!filePath) {
    return res
      .status(404)
      .send(`Missing file: ${filename}. Place ${filename} in public/ or root folder.`);
  }
  let html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes('/client.js')) {
    html = html.replace('</body>', '<script src="/client.js"></script>\n</body>');
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

app.get(['/', '/index.html', '/login.html'], (req, res) => {
  serveHtmlWithClientScript(res, 'login.html');
});

app.get('/administrator.html', (req, res) => {
  serveHtmlWithClientScript(res, 'administrator.html');
});

app.get('/manager.html', (req, res) => {
  serveHtmlWithClientScript(res, 'manager.html');
});

app.get('/employee.html', (req, res) => {
  serveHtmlWithClientScript(res, 'employee.html');
});

app.use(express.static(PUBLIC_DIR));
app.use(express.static(__dirname));

initDatabase();
app.listen(PORT, () => {
  console.log(`TaskSync Employee Management System running at http://localhost:${PORT}`);
});