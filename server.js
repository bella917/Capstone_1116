const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.json({ limit: '100kb' }));

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

// ==================== SECURITY HELPERS ====================
// Added in the security pass: sessions, password hashing, input cleaning and
// per-role permission checks. No new npm packages are required.

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours, sliding
const sessions = new Map(); // token -> { sid, userId, expires }
const loginAttempts = new Map(); // "ip|username" -> { count, lockedUntil }
const MAX_LOGIN_FAILURES = 5;
const LOGIN_LOCK_MS = 60 * 1000;

const TASK_STATUS = { NOT_STARTED: 'Not Started', IN_PROGRESS: 'In Progress', DONE: 'Completed' };
const PRIORITIES = ['High', 'Medium', 'Low'];
const ATTENDANCE_STATUSES = ['Present', 'Late / Tardy', 'On Leave'];
const LOA_STATUSES = ['Pending', 'Approved', 'Denied', 'More Info Requested'];
const ROLES = ['employee', 'manager', 'admin'];

function newId(prefix) {
  return prefix + '-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
}

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plain), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(plain, stored) {
  if (typeof stored !== 'string' || !stored.startsWith('scrypt$')) return false;
  const [, salt, hash] = stored.split('$');
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(String(plain), salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// Turns <, >, &, quotes into entities so stored text can never run as HTML.
// It first decodes the same five entities, so cleaning twice gives the same result.
const ENTITY_DECODE = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const ENTITY_ENCODE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function cleanText(value) {
  return String(value)
    .replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITY_DECODE[m])
    .replace(/[&<>"']/g, (c) => ENTITY_ENCODE[c])
    .trim()
    .slice(0, 2000);
}

function cleanDeep(value, key) {
  if (key === 'password') return typeof value === 'string' ? value.slice(0, 200) : '';
  if (typeof value === 'string') return cleanText(value);
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => cleanDeep(v));
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = cleanDeep(value[k], k);
    return out;
  }
  return value;
}

function isValidDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isEmail(s) {
  return typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Today's date in the server's own time zone (not UTC), so evening activity
// is not filed under tomorrow's date.
function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '')
    .split(';')
    .forEach((part) => {
      const i = part.indexOf('=');
      if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    });
  return out;
}

function setSessionCookie(req, res, token, maxAgeMs) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `ts_sid=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(maxAgeMs / 1000)}${secure}`
  );
}

function getSession(req) {
  const token = parseCookies(req).ts_sid;
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (s.expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  s.expires = Date.now() + SESSION_TTL_MS; // sliding expiry
  return s;
}

function homeFor(role) {
  return role === 'admin' ? '/administrator.html' : role === 'manager' ? '/manager.html' : '/employee.html';
}

function sanitizeUser(u) {
  if (!u) return null;
  const { password, ...safe } = u;
  return safe;
}

// What an employee is allowed to know about other people (needed for chat).
function publicUser(u) {
  return { id: u.id, name: u.name, role: u.role, department: u.department, position: u.position, email: u.email };
}

function readDB() {
  initDatabase();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, DB_PATH);
}

// One-time upgrade of existing data: hash plaintext passwords, rename task status.
function migrateDatabase() {
  const db = readDB();
  let changed = false;
  db.users.forEach((u) => {
    if (typeof u.password === 'string' && !u.password.startsWith('scrypt$')) {
      u.password = hashPassword(u.password);
      changed = true;
    }
  });
  db.assignments.forEach((a) => {
    if (a.status === 'Pending') {
      a.status = TASK_STATUS.NOT_STARTED;
      changed = true;
    }
  });
  if (changed) writeDB(db);
}

// Loads the logged-in user from the session cookie and checks their role.
function requireAuth(...roles) {
  return (req, res, next) => {
    const s = getSession(req);
    if (!s) return res.status(401).json({ error: 'Please log in.' });
    const db = readDB();
    const user = db.users.find((u) => u.id === s.userId);
    if (!user) {
      sessions.delete(s.sid);
      return res.status(401).json({ error: 'Please log in.' });
    }
    if (roles.length > 0 && !roles.includes(user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do that.' });
    }
    req.user = user;
    req.db = db;
    next();
  };
}

function findEmployee(db, id) {
  return db.users.find((u) => u.id === id && u.role === 'employee');
}

function progressFromBody(raw) {
  const n = Number(raw);
  if (raw === '' || raw === null || raw === undefined || !Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n);
}

function statusFromProgress(p) {
  return p >= 100 ? TASK_STATUS.DONE : p > 0 ? TASK_STATUS.IN_PROGRESS : TASK_STATUS.NOT_STARTED;
}

// ==================== GLOBAL MIDDLEWARE ====================
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// Every write must be JSON (blocks simple cross-site form posts).
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const hasBody = Number(req.headers['content-length'] || 0) > 0;
    if (hasBody && !req.is('application/json')) {
      return res.status(415).json({ error: 'JSON required.' });
    }
  }
  if (req.body && typeof req.body === 'object') req.body = cleanDeep(req.body);
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// ==================== API ROUTES ====================

// 1. Authentication
app.post('/api/auth/login', (req, res) => {
  const username = String((req.body && req.body.username) || '').toLowerCase();
  const password = String((req.body && req.body.password) || '');
  const key = `${req.ip}|${username}`;
  const attempt = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };

  if (attempt.lockedUntil > Date.now()) {
    return res.status(429).json({ error: 'Too many failed attempts. Please wait a minute and try again.' });
  }

  const db = readDB();
  const user = db.users.find(
    (u) => (u.username.toLowerCase() === username || u.email.toLowerCase() === username) && verifyPassword(password, u.password)
  );

  if (!user) {
    attempt.count += 1;
    if (attempt.count >= MAX_LOGIN_FAILURES) {
      attempt.lockedUntil = Date.now() + LOGIN_LOCK_MS;
      attempt.count = 0;
    }
    loginAttempts.set(key, attempt);
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  loginAttempts.delete(key);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { sid: token, userId: user.id, expires: Date.now() + SESSION_TTL_MS });
  setSessionCookie(req, res, token, SESSION_TTL_MS);
  res.json({ user: sanitizeUser(user), redirect: homeFor(user.role).slice(1) });
});

app.post('/api/auth/logout', (req, res) => {
  const token = parseCookies(req).ts_sid;
  if (token) sessions.delete(token);
  setSessionCookie(req, res, '', 0);
  res.json({ success: true });
});

// 2. Full State Bootstrap: each role only receives what it may see
app.get('/api/bootstrap', requireAuth(), (req, res) => {
  const db = req.db;
  const me = req.user;
  const myMessages = db.messages.filter((m) => m.senderId === me.id || m.recipientId === me.id);

  if (me.role === 'employee') {
    return res.json({
      me: sanitizeUser(me),
      users: db.users.map((u) => (u.id === me.id ? sanitizeUser(u) : publicUser(u))),
      assignments: db.assignments.filter((a) => a.employeeId === me.id),
      schedules: db.schedules.filter((s) => s.employeeId === me.id),
      loaRequests: db.loaRequests.filter((l) => l.employeeId === me.id),
      attendance: db.attendance.filter((a) => a.employeeId === me.id),
      performanceReviews: db.performanceReviews.filter((p) => p.employeeId === me.id),
      reports: [],
      messages: myMessages
    });
  }

  res.json({
    me: sanitizeUser(me),
    users: db.users.map(sanitizeUser),
    assignments: db.assignments,
    schedules: db.schedules,
    loaRequests: db.loaRequests,
    attendance: db.attendance,
    performanceReviews: db.performanceReviews,
    reports: me.role === 'admin' ? db.reports : [],
    messages: myMessages
  });
});

// 3. Employees / Users CRUD
app.post('/api/employees', requireAuth('admin', 'manager'), (req, res) => {
  const db = req.db;
  const b = req.body || {};
  const { name, email, phone, department, position, workType, birthday, joinDate, shift } = b;

  if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

  const cleanUsername = String(b.username || email.split('@')[0])
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 letters or numbers.' });
  }
  if (db.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return res.status(400).json({ error: 'Username already exists.' });
  }
  if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return res.status(400).json({ error: 'Email already exists.' });
  }

  const plainPassword = b.password || 'employee123';
  if (String(plainPassword).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  // Only an admin may create managers or admins; managers can only onboard employees.
  let role = 'employee';
  if (b.role && b.role !== 'employee') {
    if (req.user.role !== 'admin' || !ROLES.includes(b.role)) {
      return res.status(403).json({ error: 'Only an administrator can create manager or admin accounts.' });
    }
    role = b.role;
  }

  if (birthday && !isValidDate(birthday)) return res.status(400).json({ error: 'Invalid birthday.' });
  if (joinDate && !isValidDate(joinDate)) return res.status(400).json({ error: 'Invalid join date.' });
  const pto = b.ptoAvailable === undefined || b.ptoAvailable === '' ? 15 : Number(b.ptoAvailable);
  if (!Number.isFinite(pto) || pto < 0 || pto > 365) return res.status(400).json({ error: 'Invalid PTO value.' });

  const newUser = {
    id: newId('u'),
    username: cleanUsername,
    password: hashPassword(plainPassword),
    role,
    name,
    email,
    phone: phone || '555-010-0000',
    department: department || 'General',
    position: position || 'Associate',
    workType: workType || 'Full-Time (On-Site)',
    birthday: birthday || '1995-01-01',
    joinDate: joinDate || todayISO(),
    ptoAvailable: pto,
    shift: shift || '09:00 AM - 05:00 PM',
    workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  };

  db.users.push(newUser);

  if (newUser.role === 'employee') {
    db.performanceReviews.push({
      id: newId('perf'),
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

app.put('/api/employees/:id', requireAuth(), (req, res) => {
  const db = req.db;
  const me = req.user;
  const target = db.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found.' });

  const isSelf = target.id === me.id;
  const isAdmin = me.role === 'admin';
  const isManagerOfEmployee = me.role === 'manager' && target.role === 'employee';
  if (!isSelf && !isAdmin && !isManagerOfEmployee) {
    return res.status(403).json({ error: 'You do not have permission to edit this user.' });
  }

  const b = req.body || {};
  const privileged = isAdmin || isManagerOfEmployee;
  const allowed = ['name', 'email', 'phone'];
  if (privileged) allowed.push('department', 'position', 'workType', 'birthday', 'joinDate', 'ptoAvailable', 'shift');

  const updates = {};
  allowed.forEach((k) => {
    if (b[k] !== undefined && b[k] !== '') updates[k] = b[k];
  });

  if (updates.name !== undefined && !updates.name) return res.status(400).json({ error: 'Name is required.' });
  if (updates.email !== undefined) {
    if (!isEmail(updates.email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (db.users.some((u) => u.id !== target.id && u.email.toLowerCase() === String(updates.email).toLowerCase())) {
      return res.status(400).json({ error: 'Email already exists.' });
    }
  }
  if (updates.birthday !== undefined && !isValidDate(updates.birthday)) return res.status(400).json({ error: 'Invalid birthday.' });
  if (updates.joinDate !== undefined && !isValidDate(updates.joinDate)) return res.status(400).json({ error: 'Invalid join date.' });
  if (updates.ptoAvailable !== undefined) {
    const pto = Number(updates.ptoAvailable);
    if (!Number.isFinite(pto) || pto < 0 || pto > 365) return res.status(400).json({ error: 'Invalid PTO value.' });
    updates.ptoAvailable = pto;
  }

  // Password: yourself or an admin
  if (b.password) {
    if (!isSelf && !isAdmin) return res.status(403).json({ error: 'You cannot change this password.' });
    if (String(b.password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    updates.password = hashPassword(b.password);
  }

  // Role changes: admin only, and never remove the last administrator
  if (b.role !== undefined && b.role !== target.role) {
    if (!isAdmin || !ROLES.includes(b.role)) return res.status(403).json({ error: 'Only an administrator can change roles.' });
    if (target.role === 'admin' && db.users.filter((u) => u.role === 'admin').length <= 1) {
      return res.status(400).json({ error: 'You cannot remove the last administrator.' });
    }
    updates.role = b.role;
  }

  Object.assign(target, updates);
  writeDB(db);
  res.json(sanitizeUser(target));
});

app.delete('/api/employees/:id', requireAuth('admin'), (req, res) => {
  const db = req.db;
  const target = db.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'You cannot remove your own account.' });
  if (target.role === 'admin' && db.users.filter((u) => u.role === 'admin').length <= 1) {
    return res.status(400).json({ error: 'You cannot remove the last administrator.' });
  }

  const id = target.id;
  db.users = db.users.filter((u) => u.id !== id);
  db.assignments = db.assignments.filter((a) => a.employeeId !== id);
  db.schedules = db.schedules.filter((s) => s.employeeId !== id);
  db.loaRequests = db.loaRequests.filter((l) => l.employeeId !== id);
  db.attendance = db.attendance.filter((a) => a.employeeId !== id);
  db.performanceReviews = db.performanceReviews.filter((p) => p.employeeId !== id);
  writeDB(db);

  // Offboarded users are logged out immediately
  for (const [token, s] of sessions) if (s.userId === id) sessions.delete(token);
  res.json({ success: true });
});

// 4. Assignments CRUD
app.post('/api/assignments', requireAuth('admin', 'manager'), (req, res) => {
  const db = req.db;
  const { title, description, employeeId, dueDate, priority } = req.body || {};
  if (!title || !employeeId) return res.status(400).json({ error: 'Title and employee are required.' });
  if (!findEmployee(db, employeeId)) return res.status(400).json({ error: 'Please choose a valid employee.' });
  if (dueDate && !isValidDate(dueDate)) return res.status(400).json({ error: 'Invalid due date.' });
  if (priority && !PRIORITIES.includes(priority)) return res.status(400).json({ error: 'Invalid priority.' });

  const newAsg = {
    id: newId('asg'),
    title,
    description: description || '',
    employeeId,
    assignedBy: req.user.name,
    dueDate: dueDate || todayISO(),
    priority: priority || 'Medium',
    progress: 0,
    status: TASK_STATUS.NOT_STARTED,
    createdAt: todayISO()
  };

  db.assignments.push(newAsg);
  writeDB(db);
  res.status(201).json(newAsg);
});

app.put('/api/assignments/:id', requireAuth(), (req, res) => {
  const db = req.db;
  const me = req.user;
  const idx = db.assignments.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Assignment not found.' });
  const current = db.assignments[idx];
  const b = req.body || {};

  const isStaff = me.role === 'admin' || me.role === 'manager';
  if (!isStaff && current.employeeId !== me.id) {
    return res.status(403).json({ error: 'You can only update your own assignments.' });
  }

  const next = { ...current };

  if (b.progress !== undefined) {
    const p = progressFromBody(b.progress);
    if (p === null) return res.status(400).json({ error: 'Progress must be a number from 0 to 100.' });
    next.progress = p;
  }

  // Managers and admins may also edit the task details; employees may only change progress.
  if (isStaff) {
    if (b.title !== undefined) {
      if (!b.title) return res.status(400).json({ error: 'Title is required.' });
      next.title = b.title;
    }
    if (b.description !== undefined) next.description = b.description;
    if (b.dueDate !== undefined) {
      if (!isValidDate(b.dueDate)) return res.status(400).json({ error: 'Invalid due date.' });
      next.dueDate = b.dueDate;
    }
    if (b.priority !== undefined) {
      if (!PRIORITIES.includes(b.priority)) return res.status(400).json({ error: 'Invalid priority.' });
      next.priority = b.priority;
    }
    if (b.employeeId !== undefined) {
      if (!findEmployee(db, b.employeeId)) return res.status(400).json({ error: 'Please choose a valid employee.' });
      next.employeeId = b.employeeId;
    }
  }

  next.status = statusFromProgress(next.progress);
  db.assignments[idx] = next;
  writeDB(db);
  res.json(next);
});

app.delete('/api/assignments/:id', requireAuth('admin', 'manager'), (req, res) => {
  const db = req.db;
  db.assignments = db.assignments.filter((a) => a.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// 5. Schedules CRUD
app.post('/api/schedules', requireAuth('admin', 'manager'), (req, res) => {
  const db = req.db;
  const { employeeId, date, shift, note } = req.body || {};
  if (!employeeId || !date || !shift) {
    return res.status(400).json({ error: 'Employee, date, and shift are required.' });
  }
  if (!findEmployee(db, employeeId)) return res.status(400).json({ error: 'Please choose a valid employee.' });
  if (!isValidDate(date)) return res.status(400).json({ error: 'Invalid date.' });
  if (typeof shift !== 'string' || !shift.trim() || shift.trim().length > 50) {
    return res.status(400).json({ error: 'Shift hours must be 1 to 50 characters (for example 09:00 AM - 05:00 PM).' });
  }
  if (note !== undefined && note !== null && (typeof note !== 'string' || note.length > 120)) {
    return res.status(400).json({ error: 'The shift note must be 120 characters or fewer.' });
  }
  if (db.schedules.some((x) => x.employeeId === employeeId && x.date === date && x.shift === shift.trim())) {
    return res.status(409).json({ error: 'That shift is already scheduled for this employee on this date.' });
  }

  const newSched = { id: newId('sch'), employeeId, date, shift: shift.trim(), note: (note && note.trim()) || 'Scheduled Shift' };
  db.schedules.push(newSched);
  writeDB(db);
  res.status(201).json(newSched);
});

app.delete('/api/schedules/:id', requireAuth('admin', 'manager'), (req, res) => {
  const db = req.db;
  db.schedules = db.schedules.filter((s) => s.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// 6. LOA Requests
app.post('/api/loa', requireAuth('employee'), (req, res) => {
  const db = req.db;
  const { startDate, endDate, daysRequested, reason } = req.body || {};
  if (!startDate || !endDate || !reason) return res.status(400).json({ error: 'All leave fields are required.' });
  if (!isValidDate(startDate) || !isValidDate(endDate)) return res.status(400).json({ error: 'Invalid leave dates.' });
  if (endDate < startDate) return res.status(400).json({ error: 'The end date cannot be before the start date.' });

  let days = Number(daysRequested);
  if (!Number.isFinite(days) || days < 1) {
    days = Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1;
  }
  days = Math.min(Math.round(days), 365);

  const prevCount = db.loaRequests.filter((r) => r.employeeId === req.user.id).length;
  const newLoa = {
    id: newId('loa'),
    employeeId: req.user.id,
    dateReceived: todayISO(),
    startDate,
    endDate,
    daysRequested: days,
    reason,
    previousRequests: prevCount,
    status: 'Pending',
    managerNote: ''
  };

  db.loaRequests.unshift(newLoa);
  writeDB(db);
  res.status(201).json(newLoa);
});

app.put('/api/loa/:id', requireAuth('admin', 'manager'), (req, res) => {
  const db = req.db;
  const idx = db.loaRequests.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'LOA request not found.' });

  const b = req.body || {};
  const prevStatus = db.loaRequests[idx].status;
  const nextStatus = b.status !== undefined ? b.status : prevStatus;
  if (!LOA_STATUSES.includes(nextStatus)) return res.status(400).json({ error: 'Invalid status.' });

  db.loaRequests[idx].status = nextStatus;
  if (b.managerNote !== undefined) db.loaRequests[idx].managerNote = b.managerNote;

  // PTO is deducted when approved and given back if the decision is later changed
  const uIdx = db.users.findIndex((u) => u.id === db.loaRequests[idx].employeeId);
  const days = db.loaRequests[idx].daysRequested || 1;
  if (uIdx !== -1) {
    if (prevStatus !== 'Approved' && nextStatus === 'Approved') {
      db.users[uIdx].ptoAvailable = Math.max(0, (db.users[uIdx].ptoAvailable || 0) - days);
    } else if (prevStatus === 'Approved' && nextStatus !== 'Approved') {
      db.users[uIdx].ptoAvailable = (db.users[uIdx].ptoAvailable || 0) + days;
    }
  }

  writeDB(db);
  res.json(db.loaRequests[idx]);
});

// 7. Attendance: employees clock themselves in/out, managers and admins can edit logs
app.post('/api/attendance', requireAuth(), (req, res) => {
  const db = req.db;
  const me = req.user;
  const b = req.body || {};
  const isClockAction = b.action === 'clock-in' || b.action === 'clock-out';
  const todayStr = todayISO();
  const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  let employeeId;
  if (isClockAction) {
    if (me.role !== 'employee') return res.status(403).json({ error: 'Only employees can clock in or out.' });
    employeeId = me.id; // always yourself
  } else {
    if (me.role === 'employee') return res.status(403).json({ error: 'You do not have permission to edit attendance.' });
    employeeId = b.employeeId;
    if (!findEmployee(db, employeeId)) return res.status(400).json({ error: 'Please choose a valid employee.' });
    if (b.status !== undefined && !ATTENDANCE_STATUSES.includes(b.status)) {
      return res.status(400).json({ error: 'Invalid attendance status.' });
    }
    for (const k of ['totalHours', 'overtimeHours']) {
      if (b[k] !== undefined && (!Number.isFinite(Number(b[k])) || Number(b[k]) < 0 || Number(b[k]) > 24)) {
        return res.status(400).json({ error: 'Hours must be a number from 0 to 24.' });
      }
    }
  }

  let record = db.attendance.find((a) => a.employeeId === employeeId && a.date === todayStr);

  if (b.action === 'clock-in') {
    if (!record) {
      record = {
        id: newId('att'),
        employeeId,
        date: todayStr,
        clockIn: nowTime,
        clockOut: '--',
        totalHours: 0,
        overtimeHours: 0,
        status: new Date().getHours() >= 9 ? 'Late / Tardy' : 'Present'
      };
      db.attendance.push(record);
    } else {
      record.clockIn = nowTime;
    }
  } else if (b.action === 'clock-out') {
    if (!record) {
      record = {
        id: newId('att'),
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
  } else if (!record) {
    record = {
      id: newId('att'),
      employeeId,
      date: todayStr,
      clockIn: b.clockIn || '09:00 AM',
      clockOut: b.clockOut || '--',
      totalHours: Number(b.totalHours || 0),
      overtimeHours: Number(b.overtimeHours || 0),
      status: b.status || 'Present'
    };
    db.attendance.push(record);
  } else {
    if (b.clockIn !== undefined) record.clockIn = b.clockIn;
    if (b.clockOut !== undefined) record.clockOut = b.clockOut;
    if (b.totalHours !== undefined) record.totalHours = Number(b.totalHours);
    if (b.overtimeHours !== undefined) record.overtimeHours = Number(b.overtimeHours);
    if (b.status !== undefined) record.status = b.status;
  }

  writeDB(db);
  res.json(record);
});

// 8. Performance Reviews: employees write their own self review, managers/admins the rest
app.put('/api/performance/:employeeId', requireAuth(), (req, res) => {
  const db = req.db;
  const me = req.user;
  const b = req.body || {};
  const empId = req.params.employeeId;

  if (!findEmployee(db, empId)) return res.status(404).json({ error: 'Employee not found.' });
  const isStaff = me.role === 'admin' || me.role === 'manager';
  if (!isStaff && me.id !== empId) {
    return res.status(403).json({ error: 'You can only edit your own review.' });
  }

  let record = db.performanceReviews.find((p) => p.employeeId === empId);
  if (!record) {
    record = {
      id: newId('perf'),
      employeeId: empId,
      cycle: 'Q4 2026',
      selfReview: 'Pending Submission',
      managerReview: 'Draft Pending',
      finalRating: null,
      goalsMetRate: 0,
      status: 'Pending Draft'
    };
    db.performanceReviews.push(record);
  }

  for (const k of ['selfReview', 'managerReview']) {
    if (b[k] !== undefined && (typeof b[k] !== 'string' || b[k].length > 600)) {
      return res.status(400).json({ error: 'Review text must be 600 characters or fewer.' });
    }
  }
  if (b.selfReview !== undefined) record.selfReview = b.selfReview;

  if (isStaff) {
    if (b.managerReview !== undefined) record.managerReview = b.managerReview;
    if (b.finalRating !== undefined) {
      if (b.finalRating === '' || b.finalRating === null) {
        record.finalRating = null;
      } else {
        const r = Number(b.finalRating);
        if (!Number.isFinite(r) || r < 1 || r > 5) {
          return res.status(400).json({ error: 'Rating must be between 1.0 and 5.0.' });
        }
        record.finalRating = r;
      }
    }
    if (b.goalsMetRate !== undefined) {
      const g = Number(b.goalsMetRate);
      if (!Number.isFinite(g) || g < 0 || g > 100) return res.status(400).json({ error: 'Goals met rate must be 0 to 100.' });
      record.goalsMetRate = g;
    }
  }
  record.status = record.finalRating ? 'Completed' : 'Pending Draft';

  writeDB(db);
  res.json(record);
});

// 9. Reports (admin only)
app.post('/api/reports', requireAuth('admin'), (req, res) => {
  const db = req.db;
  const { type, name } = req.body || {};
  const todayStr = todayISO();

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
    const avg = rated.length > 0 ? (rated.reduce((s, p) => s + p.finalRating, 0) / rated.length).toFixed(2) : 'N/A';
    summary = `${rated.length}/${db.performanceReviews.length} evaluations finalized. Average Rating: ${avg}/5.0.`;
  } else if (type === 'Leave Report') {
    const pending = db.loaRequests.filter((l) => l.status === 'Pending').length;
    const approved = db.loaRequests.filter((l) => l.status === 'Approved').length;
    summary = `${db.loaRequests.length} total requests (${pending} Pending, ${approved} Approved).`;
  } else {
    summary = 'Organization operational report generated.';
  }

  const newReport = {
    id: newId('rep'),
    name: name || `${type || 'General Report'} (${todayStr})`,
    type: type || 'General Report',
    dateGenerated: todayStr,
    status: 'Completed',
    summary
  };

  db.reports.unshift(newReport);
  writeDB(db);
  res.status(201).json(newReport);
});

app.delete('/api/reports/:id', requireAuth('admin'), (req, res) => {
  const db = req.db;
  db.reports = db.reports.filter((r) => r.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// 10. Chat / Messaging: the sender is always the logged-in user
app.post('/api/messages', requireAuth(), (req, res) => {
  const db = req.db;
  const me = req.user;
  const { recipientEmail, recipientId, text } = req.body || {};

  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Message text is required.' });
  if (text.length > 1500) return res.status(400).json({ error: 'Messages can be up to 1,500 characters.' });

  const recipient =
    db.users.find((u) => u.id === recipientId) ||
    db.users.find((u) => u.email.toLowerCase() === String(recipientEmail || '').toLowerCase());

  if (!recipient) {
    return res.status(404).json({ error: `No user found with email ${recipientEmail || ''}.` });
  }
  if (recipient.id === me.id) return res.status(400).json({ error: 'You cannot message yourself.' });

  const msg = {
    id: newId('msg'),
    senderId: me.id,
    senderName: me.name,
    senderEmail: me.email,
    recipientId: recipient.id,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    text: text.trim(),
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
    return res.status(404).send(`Missing file: ${filename}. Place ${filename} in public/ or root folder.`);
  }
  let html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes('/client.js')) {
    html = html.replace('</body>', '<script src="/client.js"></script>\n</body>');
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(html);
}

// Portal pages: you must be logged in with the matching role
function portalPage(role, filename) {
  return (req, res) => {
    const s = getSession(req);
    const user = s && readDB().users.find((u) => u.id === s.userId);
    if (!user) return res.redirect('/');
    if (user.role !== role) return res.redirect(homeFor(user.role));
    serveHtmlWithClientScript(res, filename);
  };
}

app.get(['/', '/index.html', '/login.html'], (req, res) => {
  serveHtmlWithClientScript(res, 'login.html');
});
app.get('/administrator.html', portalPage('admin', 'administrator.html'));
app.get('/manager.html', portalPage('manager', 'manager.html'));
app.get('/employee.html', portalPage('employee', 'employee.html'));

// The only file served from outside public/ is the logo.
const LOGO_NAME = 'TaskSync Blue Gradient Logo.png';
app.get('/' + encodeURIComponent(LOGO_NAME), (req, res) => {
  const logo = resolveAssetPath(LOGO_NAME);
  if (!logo) return res.status(404).end();
  res.sendFile(logo);
});

// Never serve raw HTML from public/ (the guarded routes above handle pages),
// and never serve anything from the project root, data/ or server code.
app.use((req, res, next) => {
  if (/\.html?$/i.test(req.path)) return res.status(404).send('Not found');
  next();
});
app.use(express.static(PUBLIC_DIR, { index: false, dotfiles: 'deny' }));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found.' });
  res.status(404).send('Not found');
});

// Last-resort error handler (bad JSON etc.) so the server never leaks a stack trace
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({ error: status === 400 ? 'Invalid request.' : 'Something went wrong.' });
});

initDatabase();
migrateDatabase();
app.listen(PORT, () => {
  console.log(`TaskSync Employee Management System running at http://localhost:${PORT}`);
});
