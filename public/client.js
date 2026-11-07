(function () {
  const pathName = window.location.pathname.toLowerCase();
  let STATE = {
    currentUser: null,
    users: [],
    assignments: [],
    schedules: [],
    loaRequests: [],
    attendance: [],
    performanceReviews: [],
    reports: [],
    messages: [],
    selectedEmployeeId: null,
    selectedLoaId: null,
    selectedChatPartnerId: null,
    searchQuery: ''
  };

  // Today's date in the browser's own time zone (YYYY-MM-DD), not UTC
  function localISO(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Attendance logs for today only. The buttons and clock actions always edit
  // today's log, so the screens must read today's log too (not an older one).
  function attendanceToday() {
    const t = localISO();
    return STATE.attendance.filter((a) => a.date === t);
  }

  // Helper for API requests
  async function api(url, method = 'GET', body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, { ...opts, credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !url.includes('/api/auth/login')) {
      // Session ended or never started: go back to the login page
      try { localStorage.removeItem('tasksync_user'); } catch (e) {}
      window.location.href = '/';
      throw new Error('Please log in.');
    }
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // Inject shared utility styles that match each portal's native design
  function injectSharedStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .ts-toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; margin-bottom: 15px; }
      .ts-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 15px 0; background: #f9fafb; padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb; }
      .ts-form-grid label { display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #444; }
      .ts-form-grid input, .ts-form-grid select, .ts-form-grid textarea { width: 100%; padding: 9px 10px; border: 1px solid #ccc; border-radius: 8px; font-size: 13px; }
      .ts-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
      .ts-badge.green { background: #dcfce7; color: #166534; }
      .ts-badge.yellow { background: #fef9c3; color: #854d0e; }
      .ts-badge.red { background: #fee2e2; color: #991b1b; }
      .ts-badge.blue { background: #dbeafe; color: #1e40af; }
      .ts-small-btn { padding: 6px 12px; border-radius: 14px; border: 1px solid #ccc; background: white; cursor: pointer; font-size: 12px; font-weight: bold; margin-right: 4px; }
      .ts-small-btn:hover { background: #f0f0f0; }
      .ts-list-item { padding: 12px; border: 1px solid #eee; border-radius: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; background: #fff; }
      .ts-list-item.active { border-color: #666; background: #f5f5f5; }
      .ts-chat-thread { max-height: 280px; overflow-y: auto; padding: 10px; background: #f9fafb; border-radius: 10px; border: 1px solid #eee; margin-bottom: 12px; }
      .ts-msg { margin-bottom: 10px; padding: 8px 12px; border-radius: 10px; max-width: 80%; font-size: 13px; }
      .ts-msg.mine { background: #e8eefc; margin-left: auto; text-align: right; }
      .ts-msg.theirs { background: #ffffff; border: 1px solid #e5e5e5; }
      .ts-toast { position: fixed; bottom: 20px; right: 20px; background: #161c27; color: white; padding: 12px 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); z-index: 9999; font-size: 14px; }
      .calendar-day .shift-pill { display: block; margin-top: 4px; padding: 2px 5px; border-radius: 4px; background: #ede9fe; color: #5b21b6; font-size: 10px; font-weight: bold; }
      .calendar-day .loa-pill { display: block; margin-top: 4px; padding: 2px 5px; border-radius: 4px; background: #fef3c7; color: #92400e; font-size: 10px; font-weight: bold; }
    `;
    document.head.appendChild(style);
  }

  function showToast(msg) {
    const existing = document.querySelector('.ts-toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'ts-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // Any request that fails and is not handled on the spot shows its reason as a
  // message instead of failing silently.
  window.addEventListener('unhandledrejection', function (e) {
    const msg = e && e.reason && e.reason.message;
    if (msg && msg !== 'Please log in.' && msg !== 'Wrong portal for this account.') {
      showToast(msg);
      e.preventDefault();
    }
  });

  // ==================== 1. LOGIN PAGE LOGIC ====================
  function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    // Show quick demo credentials helper below form
    const helper = document.createElement('div');
    helper.style.cssText = 'font-size: 12px; color: #334155; margin-top: 12px; background: #f1f5f9; padding: 10px; border-radius: 8px;';
    helper.innerHTML = `
      <strong>Default Logins:</strong><br>
      Admin: <code>admin</code> / <code>admin123</code> |
      Manager: <code>manager</code> / <code>manager123</code> |
      Employee: <code>employee</code> / <code>employee123</code>
    `;
    loginForm.appendChild(helper);

    // Intercept submit in capture phase so custom employees work alongside default logins
    loginForm.addEventListener(
      'submit',
      async function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        try {
          const { user, redirect } = await api('/api/auth/login', 'POST', {
            username,
            password
          });
          localStorage.setItem('tasksync_user', JSON.stringify(user));
          window.location.href = redirect;
        } catch (err) {
          alert(err.message || 'Invalid username or password.');
        }
      },
      true
    );
  }

  // ==================== 2. SHARED DATA LOADER ====================
  async function loadState(defaultRole) {
    const data = await api('/api/bootstrap');
    STATE.sig = JSON.stringify(data); // what this screen was built from
    STATE.users = data.users;
    STATE.assignments = data.assignments;
    STATE.schedules = data.schedules;
    STATE.loaRequests = data.loaRequests;
    STATE.attendance = data.attendance;
    STATE.performanceReviews = data.performanceReviews;
    STATE.reports = data.reports;
    STATE.messages = data.messages;

    // The server tells us who is logged in (from the session cookie).
    let savedUser = data.me;
    if (!savedUser || savedUser.role !== defaultRole) {
      // Wrong portal for this account: send them to their own portal
      const home = { admin: '/administrator.html', manager: '/manager.html', employee: '/employee.html' };
      window.location.href = savedUser ? home[savedUser.role] : '/';
      throw new Error('Wrong portal for this account.');
    }
    try { localStorage.setItem('tasksync_user', JSON.stringify(savedUser)); } catch (e) {}

    STATE.currentUser = savedUser;

    const employees = STATE.users.filter((u) => u.role === 'employee');
    if (!STATE.selectedEmployeeId && employees.length > 0) {
      STATE.selectedEmployeeId = employees[0].id;
    }
    if (!STATE.selectedLoaId && STATE.loaRequests.length > 0) {
      STATE.selectedLoaId = STATE.loaRequests[0].id;
    }
  }

  // ==================== 3. ADMIN & MANAGER PORTAL LOGIC ====================
  async function initAdminOrManagerPortal(role) {
    injectSharedStyles();
    await loadState(role);

    const btnClass = role === 'admin' ? 'red-button' : 'green-button';

    // Topbar account badge & search bar
    const accountEl = document.querySelector('.topbar .account');
    if (accountEl && STATE.currentUser) {
      accountEl.innerHTML = `<span style="font-size:14px; font-weight:bold; margin-right:8px;">${STATE.currentUser.name} (${STATE.currentUser.position})</span> ☺ ▣`;
    }

    const searchInput = document.querySelector('.topbar .search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        STATE.searchQuery = e.target.value.trim().toLowerCase();
        renderAdminManagerAll(role, btnClass);
      });
    }

    renderAdminManagerAll(role, btnClass);
  }

  function renderAdminManagerAll(role, btnClass) {
    renderAMDashboard(role, btnClass);
    renderAMAssignments(role, btnClass);
    renderAMTeam(role, btnClass);
    renderAMEmployeeDetails(role, btnClass);
    renderAMRequests(role, btnClass);
    renderAMAttendance(role, btnClass);
    renderAMPerformance(role, btnClass);
    if (role === 'admin') renderAdminReports(btnClass);
    renderAMChat(role, btnClass);
    renderAMProfileSettingsHelp(role, btnClass);
  }

  // --- DASHBOARD (Admin & Manager) ---
  function renderAMDashboard(role, btnClass) {
    const dash = document.getElementById('dashboard');
    if (!dash) return;

    const h1 = dash.querySelector('h1');
    if (h1 && STATE.currentUser) {
      h1.textContent = `Welcome Back, ${STATE.currentUser.name}!`;
    }

    const cards = dash.querySelectorAll('.cards > .card');
    const pendingLoa = STATE.loaRequests.filter((r) => r.status === 'Pending');
    const pendingPerf = STATE.performanceReviews.filter(
      (p) => p.status !== 'Completed'
    );
    const activeAsg = STATE.assignments.filter((a) => a.status !== 'Completed');

    // Card 1: Notifications
    if (cards[0]) {
      cards[0].innerHTML = `
        <h3>Notifications</h3>
        <div class="ts-list-item">
          <span><strong>${pendingLoa.length}</strong> Pending Leave of Absence Request(s)</span>
          <button class="ts-small-btn" onclick="showScreen('requests')">Review</button>
        </div>
        <div class="ts-list-item">
          <span><strong>${pendingPerf.length}</strong> Performance Evaluation(s) awaiting completion</span>
          <button class="ts-small-btn" onclick="showScreen('performance')">Evaluate</button>
        </div>
        <div class="ts-list-item">
          <span><strong>${activeAsg.length}</strong> Active Employee Assignment(s) in progress</span>
          <button class="ts-small-btn" onclick="showScreen('assignments')">View</button>
        </div>
      `;
    }

    // Card 2: Employee Attendance Summary
    if (cards[1]) {
      const todayAtt = attendanceToday();
      const present = todayAtt.filter((a) => a.status === 'Present').length;
      const late = todayAtt.filter((a) => a.status === 'Late / Tardy').length;
      const ot = todayAtt.reduce(
        (sum, a) => sum + Number(a.overtimeHours || 0),
        0
      );

      cards[1].innerHTML = `
        <h3>Employee Attendance (Today)</h3>
        <div class="ts-list-item"><span>Present On-Time:</span> <span class="ts-badge green">${present}</span></div>
        <div class="ts-list-item"><span>Late / Tardy:</span> <span class="ts-badge yellow">${late}</span></div>
        <div class="ts-list-item"><span>Overtime Logged:</span> <span class="ts-badge blue">${ot.toFixed(2)} hrs</span></div>
        <br>
        <button class="${btnClass}" onclick="showScreen('attendance')">See Details</button>
      `;
    }
  }

  // --- ASSIGNMENTS (Admin & Manager) ---
  function renderAMAssignments(role, btnClass) {
    const sec = document.getElementById('assignments');
    if (!sec) return;
    const card = sec.querySelector('.card');
    if (!card) return;

    const employees = STATE.users.filter((u) => u.role === 'employee');
    const q = STATE.searchQuery;
    const filtered = STATE.assignments.filter((a) => {
      const emp = STATE.users.find((u) => u.id === a.employeeId);
      const text = `${a.title} ${a.description} ${emp ? emp.name : ''} ${a.priority} ${a.status}`.toLowerCase();
      return !q || text.includes(q);
    });

    card.innerHTML = `
      <div class="ts-toolbar">
        <h3>${role === 'admin' ? 'Employee Assignments' : 'Team Assignments'} (${filtered.length})</h3>
      </div>

      <form id="ts-add-assignment-form" class="ts-form-grid">
        <div>
          <label>Assignment Title</label>
          <input type="text" name="title" placeholder="e.g. Q4 Security Review" required>
        </div>
        <div>
          <label>Assign To Employee</label>
          <select name="employeeId" required>
            ${employees.map((e) => `<option value="${e.id}">${e.name} (${e.department})</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Due Date</label>
          <input type="date" name="dueDate" value="${localISO()}" required>
        </div>
        <div>
          <label>Priority</label>
          <select name="priority">
            <option value="High">High</option>
            <option value="Medium" selected>Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label>Description</label>
          <input type="text" name="description" placeholder="Key deliverables...">
        </div>
        <div style="display:flex; align-items:flex-end;">
          <button type="submit" class="${btnClass}" style="width:100%;">+ Assign Task</button>
        </div>
      </form>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Employee</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              filtered.length === 0
                ? `<tr><td colspan="7" style="text-align:center;">No assignments found.</td></tr>`
                : filtered
                    .map((a) => {
                      const emp = STATE.users.find((u) => u.id === a.employeeId);
                      return `
                        <tr>
                          <td><strong>${a.title}</strong><br><small style="color:#666;">${a.description || ''}</small></td>
                          <td>${emp ? emp.name : 'Unassigned'}</td>
                          <td>${a.dueDate}</td>
                          <td><span class="ts-badge ${a.priority === 'High' ? 'red' : a.priority === 'Medium' ? 'yellow' : 'blue'}">${a.priority}</span></td>
                          <td>
                            <input type="number" min="0" max="100" value="${a.progress}" style="width:65px; padding:4px;"
                              onchange="window.TS.updateAssignmentProgress('${a.id}', this.value)"> %
                          </td>
                          <td><span class="ts-badge ${a.status === 'Completed' ? 'green' : 'blue'}">${a.status}</span></td>
                          <td>
                            <button class="ts-small-btn" onclick="window.TS.deleteAssignment('${a.id}')">Delete</button>
                          </td>
                        </tr>
                      `;
                    })
                    .join('')
            }
          </tbody>
        </table>
      </div>
    `;

    const form = document.getElementById('ts-add-assignment-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        await api('/api/assignments', 'POST', {
          title: fd.get('title'),
          employeeId: fd.get('employeeId'),
          dueDate: fd.get('dueDate'),
          priority: fd.get('priority'),
          description: fd.get('description'),
          assignedBy: STATE.currentUser ? STATE.currentUser.name : 'Management'
        });
        await loadState(role);
        renderAdminManagerAll(role, btnClass);
        showToast('Assignment created.');
      });
    }
  }

  // --- MY TEAM (Admin & Manager) ---
  function renderAMTeam(role, btnClass) {
    const sec = document.getElementById('team');
    if (!sec) return;
    const card = sec.querySelector('.card');
    if (!card) return;

    const q = STATE.searchQuery;
    const employees = STATE.users
      .filter((u) => u.role === 'employee')
      .filter((e) => {
        const text = `${e.name} ${e.department} ${e.position} ${e.email}`.toLowerCase();
        return !q || text.includes(q);
      });

    card.innerHTML = `
      <div class="ts-toolbar">
        <h3>Employee Directory (${employees.length})</h3>
      </div>

      <form id="ts-add-employee-form" class="ts-form-grid">
        <div>
          <label>Full Name</label>
          <input type="text" name="name" placeholder="Jane Doe" required>
        </div>
        <div>
          <label>Username</label>
          <input type="text" name="username" placeholder="jdoe" required>
        </div>
        <div>
          <label>Password</label>
          <input type="text" name="password" value="employee123" required>
        </div>
        <div>
          <label>Email</label>
          <input type="email" name="email" placeholder="jdoe@tasksync.com" required>
        </div>
        <div>
          <label>Phone Number</label>
          <input type="text" name="phone" placeholder="555-010-4000">
        </div>
        <div>
          <label>Department</label>
          <input type="text" name="department" placeholder="Engineering" required>
        </div>
        <div>
          <label>Role / Position</label>
          <input type="text" name="position" placeholder="Frontend Developer" required>
        </div>
        <div>
          <label>Work Type</label>
          <select name="workType">
            <option value="Full-Time (On-Site)">Full-Time (On-Site)</option>
            <option value="Full-Time (Hybrid)">Full-Time (Hybrid)</option>
            <option value="Full-Time (Remote)">Full-Time (Remote)</option>
            <option value="Part-Time">Part-Time</option>
          </select>
        </div>
        <div>
          <label>Default Shift</label>
          <input type="text" name="shift" value="09:00 AM - 05:00 PM">
        </div>
        <div style="display:flex; align-items:flex-end;">
          <button type="submit" class="${btnClass}" style="width:100%;">+ Add Employee</button>
        </div>
      </form>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Department</th>
              <th>Position</th>
              <th>Work Type</th>
              <th>Shift</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              employees.length === 0
                ? `<tr><td colspan="7" style="text-align:center;">No employees match your criteria.</td></tr>`
                : employees
                    .map(
                      (e) => `
                  <tr>
                    <td><strong>${e.name}</strong><br><small>${e.email}</small></td>
                    <td><code>${e.username}</code></td>
                    <td>${e.department}</td>
                    <td>${e.position}</td>
                    <td>${e.workType}</td>
                    <td>${e.shift || '09:00 AM - 05:00 PM'}</td>
                    <td>
                      <button class="${btnClass}" style="padding:7px 14px; font-size:12px;" onclick="window.TS.inspectEmployee('${e.id}')">View Details</button>
                      ${
                        role === 'admin'
                          ? `<button class="ts-small-btn" onclick="window.TS.removeEmployee('${e.id}')">Remove</button>`
                          : ''
                      }
                    </td>
                  </tr>
                `
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
    `;

    const form = document.getElementById('ts-add-employee-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        try {
          const created = await api('/api/employees', 'POST', Object.fromEntries(fd.entries()));
          STATE.selectedEmployeeId = created.id;
          await loadState(role);
          renderAdminManagerAll(role, btnClass);
          showToast(`Added employee ${created.name} (login: ${created.username}).`);
        } catch (err) {
          alert(err.message);
        }
      });
    }
  }

  // --- EMPLOYEE DETAILS (Admin & Manager) ---
  function renderAMEmployeeDetails(role, btnClass) {
    const sec = document.getElementById('employee-details');
    if (!sec) return;

    const employees = STATE.users.filter((u) => u.role === 'employee');
    const emp =
      employees.find((e) => e.id === STATE.selectedEmployeeId) || employees[0];
    if (!emp) return;

    const cards = sec.querySelectorAll('.cards > .card');
    const empTasks = STATE.assignments.filter((a) => a.employeeId === emp.id);
    const empScheds = STATE.schedules
      .filter((s) => s.employeeId === emp.id)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const avgProgress =
      empTasks.length > 0
        ? Math.round(
            empTasks.reduce((sum, t) => sum + Number(t.progress || 0), 0) /
              empTasks.length
          )
        : 0;

    if (cards[0]) {
      cards[0].innerHTML = `
        <div class="ts-toolbar">
          <h3>Employee Information</h3>
          <select onchange="window.TS.inspectEmployee(this.value)" style="padding:6px 10px; border-radius:8px;">
            ${employees
              .map(
                (e) =>
                  `<option value="${e.id}" ${e.id === emp.id ? 'selected' : ''}>${e.name}</option>`
              )
              .join('')}
          </select>
        </div>
        <p><strong>Name:</strong> ${emp.name}</p>
        <p><strong>Department:</strong> ${emp.department}</p>
        <p><strong>Position:</strong> ${emp.position}</p>
        <p><strong>Work Type:</strong> ${emp.workType}</p>
        <p><strong>Birthday:</strong> ${emp.birthday}</p>
        <p><strong>Email:</strong> ${emp.email}</p>
        <p><strong>Phone Number:</strong> ${emp.phone}</p>
        <p><strong>Company Join Date:</strong> ${emp.joinDate}</p>
        <p><strong>PTO Available:</strong> ${emp.ptoAvailable} days</p>
        <hr>
        <h3>Today's Hours & Shift Schedule</h3>
        <p><strong>Standard Shift:</strong> ${emp.shift || '09:00 AM - 05:00 PM'}</p>
        <div style="margin:10px 0;">
          ${
            empScheds.length === 0
              ? `<p style="color:gray;">No special shifts scheduled.</p>`
              : empScheds
                  .map(
                    (s) => `
                <div class="ts-list-item">
                  <span><strong>${s.date}:</strong> ${s.shift} (${s.note})</span>
                  <button class="ts-small-btn" onclick="window.TS.deleteSchedule('${s.id}')">Remove</button>
                </div>`
                  )
                  .join('')
          }
        </div>
        <form id="ts-assign-schedule-form" class="ts-form-grid">
          <div>
            <label>Date</label>
            <input type="date" name="date" value="${localISO()}" required>
          </div>
          <div>
            <label>Shift Hours</label>
            <input type="text" name="shift" value="${emp.shift || '09:00 AM - 05:00 PM'}" required>
          </div>
          <div>
            <label>Shift Note</label>
            <input type="text" name="note" placeholder="e.g. On-Call / Sprint Release">
          </div>
          <div style="display:flex; align-items:flex-end;">
            <button type="submit" class="${btnClass}" style="width:100%;">+ Add Shift</button>
          </div>
        </form>
      `;

      const schedForm = document.getElementById('ts-assign-schedule-form');
      if (schedForm) {
        schedForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(schedForm);
          await api('/api/schedules', 'POST', {
            employeeId: emp.id,
            date: fd.get('date'),
            shift: fd.get('shift'),
            note: fd.get('note')
          });
          await loadState(role);
          renderAdminManagerAll(role, btnClass);
          showToast('Shift scheduled.');
        });
      }
    }

    if (cards[1]) {
      cards[1].innerHTML = `
        <h3>Task Progress (${avgProgress}%)</h3>
        <div class="progress">
          <div class="progress-fill" style="width:${avgProgress}%;"></div>
        </div>
        <h3>Task List (${empTasks.length})</h3>
        ${
          empTasks.length === 0
            ? `<div class="empty">No tasks have been assigned to ${emp.name}.</div>`
            : empTasks
                .map(
                  (t) => `
              <div class="ts-list-item">
                <div>
                  <strong>${t.title}</strong> <span class="ts-badge ${t.status === 'Completed' ? 'green' : 'blue'}">${t.progress}%</span>
                  <div style="font-size:12px; color:#666;">Due: ${t.dueDate} | Priority: ${t.priority}</div>
                </div>
                <input type="number" min="0" max="100" value="${t.progress}" style="width:65px; padding:5px;"
                  onchange="window.TS.updateAssignmentProgress('${t.id}', this.value)">
              </div>
            `
                )
                .join('')
        }
        <hr>
        <h3>Assign a Task to ${emp.name}</h3>
        <form id="ts-detail-assign-form" class="ts-form-grid">
          <div><label>Task Title</label><input type="text" name="title" placeholder="e.g. Update client report" required></div>
          <div><label>Due Date</label><input type="date" name="dueDate" value="${localISO()}" required></div>
          <div>
            <label>Priority</label>
            <select name="priority">
              <option value="High">High</option>
              <option value="Medium" selected>Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div><label>Description</label><input type="text" name="description" placeholder="Key deliverables..."></div>
          <div style="display:flex; align-items:flex-end;">
            <button type="submit" class="${btnClass}" style="width:100%;">+ Assign Task</button>
          </div>
        </form>
      `;
    }
    const detailAssignForm = document.getElementById('ts-detail-assign-form');
    if (detailAssignForm) {
      detailAssignForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(detailAssignForm);
        try {
          await api('/api/assignments', 'POST', {
            title: fd.get('title'),
            employeeId: emp.id,
            dueDate: fd.get('dueDate'),
            priority: fd.get('priority'),
            description: fd.get('description')
          });
          await loadState(role);
          renderAdminManagerAll(role, btnClass);
          showToast(`Task assigned to ${emp.name}.`);
        } catch (err) {
          alert(err.message);
        }
      });
    }
  }

  // --- LOA REQUESTS (Admin & Manager) ---
  function renderAMRequests(role, btnClass) {
    const sec = document.getElementById('requests');
    if (!sec) return;
    const cards = sec.querySelectorAll('.card');
    if (cards.length < 2) return;

    const selected =
      STATE.loaRequests.find((r) => r.id === STATE.selectedLoaId) ||
      STATE.loaRequests[0];

    cards[0].innerHTML = `
      <h3>Leave of Absence Requests (${STATE.loaRequests.length})</h3>
      ${
        STATE.loaRequests.length === 0
          ? `<div class="empty">No leave of absence requests have been submitted.</div>`
          : STATE.loaRequests
              .map((r) => {
                const emp = STATE.users.find((u) => u.id === r.employeeId);
                const badgeColor =
                  r.status === 'Approved'
                    ? 'green'
                    : r.status === 'Denied'
                    ? 'red'
                    : 'yellow';
                return `
                  <div class="ts-list-item ${selected && selected.id === r.id ? 'active' : ''}"
                       style="cursor:pointer;"
                       onclick="window.TS.selectLoa('${r.id}')">
                    <div>
                      <strong>${emp ? emp.name : 'Employee'}</strong> — ${r.startDate} to ${r.endDate} (${r.daysRequested} day(s))
                      <div style="font-size:12px; color:#666;">Reason: ${r.reason}</div>
                    </div>
                    <span class="ts-badge ${badgeColor}">${r.status}</span>
                  </div>
                `;
              })
              .join('')
      }
    `;

    if (selected) {
      const emp = STATE.users.find((u) => u.id === selected.employeeId);
      cards[1].innerHTML = `
        <h3>Request Details</h3>
        <p><strong>Employee:</strong> ${emp ? emp.name : '--'} (${emp ? emp.department : '--'})</p>
        <p><strong>Date Received:</strong> ${selected.dateReceived}</p>
        <p><strong>Dates Requested Off:</strong> ${selected.startDate} to ${selected.endDate} (${selected.daysRequested} day(s))</p>
        <p><strong>Reason:</strong> ${selected.reason}</p>
        <p><strong>Previous LOA Requests:</strong> ${selected.previousRequests}</p>
        <p><strong>PTO Available:</strong> ${emp ? emp.ptoAvailable : 0} days</p>
        <p><strong>Current Status:</strong> <span class="ts-badge ${selected.status === 'Approved' ? 'green' : selected.status === 'Denied' ? 'red' : 'yellow'}">${selected.status}</span></p>
        ${selected.managerNote ? `<p><strong>Reviewer Note:</strong> ${selected.managerNote}</p>` : ''}
        <div style="margin-top:15px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="${btnClass}" onclick="window.TS.decideLoa('${selected.id}', 'Approved')">Accept</button>
          <button class="${btnClass}" onclick="window.TS.decideLoa('${selected.id}', 'Denied')">Deny</button>
          <button class="${btnClass}" onclick="window.TS.decideLoa('${selected.id}', 'More Info Requested')">Request More Information</button>
        </div>
      `;
    }
  }

  // --- ATTENDANCE (Admin & Manager) ---
  function renderAMAttendance(role, btnClass) {
    const sec = document.getElementById('attendance');
    if (!sec) return;

    const employees = STATE.users.filter((u) => u.role === 'employee');
    const todayAtt = attendanceToday();
    const presentCount = todayAtt.filter((a) => a.status === 'Present').length;
    const lateCount = todayAtt.filter((a) => a.status === 'Late / Tardy').length;
    const onLeaveCount =
      todayAtt.filter((a) => a.status === 'On Leave').length +
      STATE.loaRequests.filter((l) => l.status === 'Approved').length;
    const totalOt = todayAtt.reduce(
      (sum, a) => sum + Number(a.overtimeHours || 0),
      0
    );

    const stats = sec.querySelectorAll('.stats .stat strong');
    if (stats.length >= 4) {
      stats[0].textContent = presentCount;
      stats[1].textContent = lateCount;
      stats[2].textContent = onLeaveCount;
      stats[3].textContent = `${totalOt.toFixed(1)} hrs`;
    }

    const tbody = sec.querySelector('table tbody');
    if (tbody) {
      tbody.innerHTML = employees
        .map((emp) => {
          const rec = todayAtt.find((a) => a.employeeId === emp.id) || {
            clockIn: '--',
            clockOut: '--',
            totalHours: 0,
            overtimeHours: 0,
            status: 'Absent / Not Clocked In'
          };
          const badge =
            rec.status === 'Present'
              ? 'green'
              : rec.status === 'Late / Tardy'
              ? 'yellow'
              : 'red';
          return `
            <tr>
              <td><strong>${emp.name}</strong><br><small>${emp.department}</small></td>
              <td>${rec.clockIn}</td>
              <td>${rec.clockOut}</td>
              <td>${rec.totalHours} hrs ${rec.overtimeHours ? `(+${rec.overtimeHours} OT)` : ''}</td>
              <td><span class="ts-badge ${badge}">${rec.status}</span></td>
              <td>
                <button class="ts-small-btn" onclick="window.TS.quickAttendance('${emp.id}', 'Present')">Mark Present</button>
                <button class="ts-small-btn" onclick="window.TS.quickAttendance('${emp.id}', 'Late / Tardy')">Mark Late</button>
                <button class="ts-small-btn" onclick="window.TS.quickAttendance('${emp.id}', 'On Leave')">On Leave</button>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }

  // --- PERFORMANCE REVIEW (Admin & Manager) ---
  function renderAMPerformance(role, btnClass) {
    const sec = document.getElementById('performance');
    if (!sec) return;

    const employees = STATE.users.filter((u) => u.role === 'employee');
    const pendingDrafts = STATE.performanceReviews.filter(
      (p) => p.finalRating === null
    ).length;
    const completed = STATE.performanceReviews.filter((p) => p.finalRating !== null);
    const avgRating =
      completed.length > 0
        ? (
            completed.reduce((s, p) => s + Number(p.finalRating), 0) /
            completed.length
          ).toFixed(2)
        : '--';
    const cycleProgress =
      STATE.performanceReviews.length > 0
        ? Math.round((completed.length / STATE.performanceReviews.length) * 100) + '%'
        : '0%';
    const avgGoals =
      STATE.performanceReviews.length > 0
        ? Math.round(
            STATE.performanceReviews.reduce(
              (s, p) => s + Number(p.goalsMetRate || 0),
              0
            ) / STATE.performanceReviews.length
          ) + '%'
        : '--';

    const stats = sec.querySelectorAll('.stats .stat strong');
    if (stats.length >= 4) {
      stats[0].textContent = pendingDrafts;
      stats[1].textContent = avgRating === '--' ? '--' : `${avgRating} / 5.0`;
      stats[2].textContent = cycleProgress;
      stats[3].textContent = avgGoals;
    }

    const tbody = sec.querySelector('table tbody');
    if (tbody) {
      tbody.innerHTML = employees
        .map((emp) => {
          const rev = STATE.performanceReviews.find(
            (p) => p.employeeId === emp.id
          ) || {
            selfReview: 'Pending Submission',
            managerReview: 'Draft Pending',
            finalRating: null,
            goalsMetRate: 80
          };
          return `
            <tr>
              <td><strong>${emp.name}</strong></td>
              <td>${emp.position}</td>
              <td>${rev.selfReview}</td>
              <td>
                <input type="text" id="mgr-rev-${emp.id}" value="${rev.managerReview}" style="width:180px; padding:5px;">
              </td>
              <td>
                <input type="number" id="mgr-rate-${emp.id}" step="0.1" min="1" max="5"
                  value="${rev.finalRating ?? ''}" placeholder="1.0 - 5.0" style="width:80px; padding:5px;">
              </td>
              <td>
                <button class="${btnClass}" style="padding:6px 14px; font-size:12px;"
                  onclick="window.TS.savePerformance('${emp.id}')">Save Evaluation</button>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }

  // --- REPORTS (Administrator Only) ---
  function renderAdminReports(btnClass) {
    const sec = document.getElementById('reports');
    if (!sec) return;

    const employees = STATE.users.filter((u) => u.role === 'employee');
    const activeAsg = STATE.assignments.filter((a) => a.status !== 'Completed');
    const pendingLoa = STATE.loaRequests.filter((l) => l.status === 'Pending');

    const stats = sec.querySelectorAll('.stats .stat strong');
    if (stats.length >= 4) {
      stats[0].textContent = employees.length;
      stats[1].textContent = activeAsg.length;
      stats[2].textContent = pendingLoa.length;
      stats[3].textContent = STATE.reports.length;
    }

    const reportCards = sec.querySelectorAll('.report-grid .report-card');
    const reportTypes = [
      {
        type: 'Employee Report',
        info: `${employees.length} active employees across ${
          new Set(employees.map((e) => e.department)).size
        } departments.`
      },
      {
        type: 'Attendance Report',
        info: `${attendanceToday().length} attendance logs recorded today.`
      },
      {
        type: 'Performance Report',
        info: `${
          STATE.performanceReviews.filter((p) => p.finalRating !== null).length
        } of ${STATE.performanceReviews.length} evaluations completed.`
      },
      {
        type: 'Leave Report',
        info: `${STATE.loaRequests.length} total leave requests (${pendingLoa.length} pending).`
      }
    ];

    reportCards.forEach((rc, idx) => {
      const meta = reportTypes[idx];
      if (!meta) return;
      const emptyEl = rc.querySelector('.empty') || rc.querySelector('.ts-rep-box');
      if (emptyEl) {
        emptyEl.className = 'ts-rep-box';
        emptyEl.innerHTML = `
          <p style="font-weight:bold; color:#333;">${meta.info}</p>
          <button class="${btnClass}" onclick="window.TS.generateReport('${meta.type}')">Generate ${meta.type}</button>
        `;
      }
    });

    const tbody = sec.querySelector('table tbody');
    if (tbody) {
      tbody.innerHTML =
        STATE.reports.length === 0
          ? `<tr><td colspan="5" style="text-align:center;">No reports have been generated yet.</td></tr>`
          : STATE.reports
              .map(
                (r) => `
            <tr>
              <td><strong>${r.name}</strong><br><small style="color:#666;">${r.summary}</small></td>
              <td>${r.type}</td>
              <td>${r.dateGenerated}</td>
              <td><span class="ts-badge green">${r.status}</span></td>
              <td>
                <button class="ts-small-btn" onclick="window.TS.exportReportCSV('${r.id}')">Download CSV</button>
                <button class="ts-small-btn" onclick="window.TS.deleteReport('${r.id}')">Delete</button>
              </td>
            </tr>
          `
              )
              .join('');
    }
  }

  // --- CHAT (Admin & Manager) ---
  function renderAMChat(role, btnClass) {
    const sec = document.getElementById('chat');
    if (!sec) return;

    const contacts = STATE.users.filter((u) => u.id !== STATE.currentUser.id);
    if (!STATE.selectedChatPartnerId && contacts.length > 0) {
      STATE.selectedChatPartnerId = contacts[0].id;
    }
    const partner = contacts.find((c) => c.id === STATE.selectedChatPartnerId);

    const cards = sec.querySelectorAll('.chat-layout > .card');
    if (cards.length < 2) return;

    // Left Card: Conversations List
    cards[0].innerHTML = `
      <h3>Conversations</h3>
      <div>
        ${contacts
          .map(
            (c) => `
          <div class="ts-list-item ${partner && partner.id === c.id ? 'active' : ''}"
               style="cursor:pointer;"
               onclick="window.TS.selectChatPartner('${c.id}')">
            <div>
              <strong>${c.name}</strong>
              <div style="font-size:12px; color:#666;">${c.position} (${c.email})</div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    // Right Card: Active Thread
    const thread = STATE.messages.filter(
      (m) =>
        partner &&
        ((m.senderId === STATE.currentUser.id && m.recipientId === partner.id) ||
          (m.senderId === partner.id && m.recipientId === STATE.currentUser.id))
    );

    cards[1].innerHTML = `
      <h3>Conversation with ${partner ? partner.name : '--'}</h3>
      <hr>
      <div class="ts-chat-thread">
        ${
          thread.length === 0
            ? `<div class="empty">No messages with ${partner ? partner.name : 'this user'} yet. Say hello!</div>`
            : thread
                .map(
                  (m) => `
              <div class="ts-msg ${m.senderId === STATE.currentUser.id ? 'mine' : 'theirs'}">
                <strong>${m.senderName}:</strong> ${m.text}
                <div style="font-size:10px; color:#777; margin-top:3px;">${new Date(m.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
            `
                )
                .join('')
        }
      </div>
      <form id="ts-chat-send-form">
        <input class="chat-input" type="text" name="text" placeholder="Type a message to ${partner ? partner.name : ''}..." required>
        <br><br>
        <button type="submit" class="${btnClass}">Send</button>
      </form>
    `;

    const chatForm = document.getElementById('ts-chat-send-form');
    if (chatForm && partner) {
      chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatForm.elements.text.value.trim();
        if (!text) return;
        await api('/api/messages', 'POST', {
          senderId: STATE.currentUser.id,
          recipientId: partner.id,
          text
        });
        await loadState(role);
        renderAMChat(role, btnClass);
      });
    }
  }

  // --- PROFILE, SETTINGS & HELP (Admin & Manager) ---
  function renderAMProfileSettingsHelp(role, btnClass) {
    const u = STATE.currentUser;
    if (!u) return;

    const profCard = document.querySelector('#profile .card');
    if (profCard) {
      profCard.innerHTML = `
        <h3>${role === 'admin' ? 'Administrator' : 'Manager'} Information</h3>
        <p><strong>Name:</strong> ${u.name}</p>
        <p><strong>Username:</strong> ${u.username}</p>
        <p><strong>Email:</strong> ${u.email}</p>
        <p><strong>Phone:</strong> ${u.phone}</p>
        <p><strong>Department:</strong> ${u.department}</p>
        <p><strong>Position:</strong> ${u.position}</p>
        <p><strong>Company Join Date:</strong> ${u.joinDate}</p>
      `;
    }

    const setCard = document.querySelector('#settings .card');
    if (setCard) {
      setCard.innerHTML = `
        <h3>Account Settings</h3>
        <form id="ts-settings-form" class="ts-form-grid">
          <div><label>Full Name</label><input type="text" name="name" value="${u.name}" required></div>
          <div><label>Email</label><input type="email" name="email" value="${u.email}" required></div>
          <div><label>Phone</label><input type="text" name="phone" value="${u.phone}"></div>
          <div><label>Department</label><input type="text" name="department" value="${u.department}"></div>
          <div><label>New Password (optional)</label><input type="password" name="password" placeholder="Leave blank to keep current"></div>
          <div style="display:flex; align-items:flex-end;">
            <button type="submit" class="${btnClass}" style="width:100%;">Save Settings</button>
          </div>
        </form>
      `;

      const form = document.getElementById('ts-settings-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          const payload = Object.fromEntries(fd.entries());
          if (!payload.password) delete payload.password;
          const updated = await api(`/api/employees/${u.id}`, 'PUT', payload);
          localStorage.setItem('tasksync_user', JSON.stringify(updated));
          await loadState(role);
          renderAdminManagerAll(role, btnClass);
          showToast('Account settings updated.');
        });
      }
    }

    const helpCard = document.querySelector('#help .card');
    if (helpCard) {
      helpCard.innerHTML = `
        <h3>Need Assistance?</h3>
        <p><strong>IT Helpdesk Phone:</strong> 555-555-5555 (Available Mon-Fri 8:00 AM - 6:00 PM)</p>
        <p><strong>Support Email:</strong> support@tasksync.com</p>
        <p><strong>System Modules Included:</strong> Employee Onboarding, Shift Scheduling, Daily Attendance Tracking, LOA Approvals, Task Assignments, Performance Reviews, Organization Reports, and Direct Messaging (Payroll Excluded).</p>
      `;
    }
  }

  // ==================== 4. EMPLOYEE PORTAL LOGIC ====================
  async function initEmployeePortal() {
    injectSharedStyles();
    await loadState('employee');

    const topH1 = document.querySelector('.topbar h1');
    if (topH1 && STATE.currentUser) {
      topH1.textContent = `Welcome Back, ${STATE.currentUser.name}!`;
    }

    const searchInput = document.querySelector('.topbar .search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        STATE.searchQuery = e.target.value.trim().toLowerCase();
        renderEmployeeAll();
      });
    }

    // Hook into renderCalendar so navigating months keeps shift badges displayed
    if (typeof window.changeMonth === 'function') {
      const origChangeMonth = window.changeMonth;
      window.changeMonth = function (amount) {
        origChangeMonth(amount);
        decorateEmployeeCalendar();
      };
    }

    renderEmployeeAll();
  }

  function renderEmployeeInbox() {
    const u = STATE.currentUser;
    if (!u) return;

    // Render inbox below employee chat form
    let inboxEl = document.getElementById('ts-emp-inbox');
    if (!inboxEl) {
      inboxEl = document.createElement('div');
      inboxEl.id = 'ts-emp-inbox';
      inboxEl.className = 'card';
      inboxEl.style.maxWidth = '680px';
      inboxEl.style.margin = '20px auto';
      const chatSec = document.getElementById('chat');
      if (chatSec) chatSec.appendChild(inboxEl);
    }
    const myMsgs = STATE.messages.filter(
      (m) => m.senderId === u.id || m.recipientId === u.id
    );
    inboxEl.innerHTML = `
      <h3>Message History (${myMsgs.length})</h3>
      <p style="font-size:12px; color:#666;">Directory: ${
        STATE.users
          .filter((x) => x.id !== u.id && (x.role === 'manager' || x.role === 'admin'))
          .map((x) => `${x.name} <code>${x.email}</code> (${x.role === 'admin' ? 'Admin' : 'Manager'})`)
          .join(' | ') || 'No managers or admins found.'
      }</p>
      <div class="ts-chat-thread">
        ${
          myMsgs.length === 0
            ? `<div class="empty">No messages yet.</div>`
            : myMsgs
                .map(
                  (m) => `
              <div class="ts-msg ${m.senderId === u.id ? 'mine' : 'theirs'}">
                <strong>${m.senderName} → ${m.recipientName}:</strong> ${m.text}
                <div style="font-size:10px; color:#777;">${new Date(m.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
            `
                )
                .join('')
        }
      </div>
    `;
  }

  function renderEmployeeAll() {
    const u = STATE.currentUser;
    if (!u) return;

    const myTasks = STATE.assignments.filter((a) => a.employeeId === u.id);
    const myScheds = STATE.schedules
      .filter((s) => s.employeeId === u.id)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const myLoas = STATE.loaRequests.filter((l) => l.employeeId === u.id);
    const todayStr = localISO();
    const myTodayAtt = STATE.attendance.find(
      (a) => a.employeeId === u.id && a.date === todayStr
    );

    // 1. Employee Dashboard
    const notifCards = document.querySelectorAll('#dashboard .notification-card');
    if (notifCards[0]) {
      notifCards[0].innerHTML = `
        <h3>Schedule & Attendance</h3>
        <p><strong>Standard Shift:</strong> ${u.shift || '09:00 AM - 05:00 PM'}</p>
        <p><strong>Today's Status:</strong> ${
          myTodayAtt
            ? `Clocked In (${myTodayAtt.clockIn}) | Out: ${myTodayAtt.clockOut}`
            : 'Not Clocked In Yet'
        }</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
          <button class="purple-button" style="padding:8px 16px;" onclick="window.TS.empClock('clock-in')">Clock In</button>
          <button class="purple-button" style="padding:8px 16px;" onclick="window.TS.empClock('clock-out')">Clock Out</button>
          <button class="ts-small-btn" onclick="showPage('schedule')">Schedule</button>
        </div>
      `;
    }

    if (notifCards[1]) {
      const pendingCount = myTasks.filter((t) => t.status !== 'Completed').length;
      notifCards[1].innerHTML = `
        <h3>New Assignments</h3>
        <p>You have <strong>${pendingCount}</strong> active assignment(s) and <strong>${
          myTasks.length - pendingCount
        }</strong> completed assignment(s).</p>
        <button class="purple-button" onclick="showPage('assignments')">Continue</button>
      `;
    }

    // Donut Charts on Dashboard & Assignments
    const avgPct =
      myTasks.length > 0
        ? Math.round(
            myTasks.reduce((s, t) => s + Number(t.progress || 0), 0) / myTasks.length
          )
        : 0;

    document.querySelectorAll('.donut').forEach((donut) => {
      donut.style.background = `conic-gradient(#8852e8 ${avgPct * 3.6}deg, #eee8fc 0deg)`;
      const center = donut.querySelector('.donut-center');
      if (center) center.textContent = myTasks.length;
    });

    const dashSummaryEmpty = document.querySelector(
      '#dashboard .cards > .card:nth-child(2) .empty'
    );
    if (dashSummaryEmpty) {
      dashSummaryEmpty.innerHTML = `${myTasks.length} Total Assignments (${avgPct}% Avg Completion)`;
    }

    // 2. Employee Assignments Page
    const q = STATE.searchQuery;
    const filteredTasks = myTasks.filter(
      (t) =>
        !q ||
        `${t.title} ${t.description} ${t.priority} ${t.status}`
          .toLowerCase()
          .includes(q)
    );

    const asgTbody = document.querySelector('#assignments table tbody');
    if (asgTbody) {
      asgTbody.innerHTML =
        filteredTasks.length === 0
          ? `<tr><td colspan="4" style="text-align:center;">No assignments found.</td></tr>`
          : filteredTasks
              .map(
                (t) => `
            <tr>
              <td><strong>${t.title}</strong><br><small style="color:#666;">${t.description || ''}</small></td>
              <td>${t.dueDate}</td>
              <td><span class="ts-badge ${t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'yellow' : 'blue'}">${t.priority}</span></td>
              <td>
                <input type="range" min="0" max="100" step="5" value="${t.progress}"
                  onchange="window.TS.empUpdateTask('${t.id}', this.value)" style="vertical-align:middle;">
                <strong>${t.progress}%</strong>
                <span class="ts-badge ${t.status === 'Completed' ? 'green' : t.status === 'In Progress' ? 'blue' : 'yellow'}">${t.status}</span>
                ${t.progress < 100 ? `<button class="ts-small-btn" onclick="window.TS.empUpdateTask('${t.id}', 100)">Mark Complete</button>` : ''}
              </td>
            </tr>
          `
              )
              .join('');
    }

    const asgOverviewEmpty = document.querySelector(
      '#assignments .cards > .card:nth-child(2) .empty'
    );
    if (asgOverviewEmpty) {
      const done = myTasks.filter((t) => t.status === 'Completed').length;
      asgOverviewEmpty.innerHTML = `
        <strong>Completed:</strong> ${done} / ${myTasks.length}<br>
        <strong>Average Progress:</strong> ${avgPct}%
      `;
    }

    // 3. Employee Schedule & LOA Submission
    decorateEmployeeCalendar();
    const schedCard = document.querySelector('#schedule .card');
    if (schedCard) {
      schedCard.innerHTML = `
        <h3>Upcoming Schedule & Shifts</h3>
        <div class="ts-list-item">
          <span><strong>Regular Shift:</strong> ${u.shift || '09:00 AM - 05:00 PM'} (Mon - Fri)</span>
          <span class="ts-badge blue">${u.workType}</span>
        </div>
        ${myScheds
          .map(
            (s) => `
          <div class="ts-list-item">
            <span><strong>${s.date}:</strong> ${s.shift} — ${s.note}</span>
            <span class="ts-badge ${s.date < todayStr ? 'blue' : 'green'}">${s.date < todayStr ? 'Past' : 'Scheduled'}</span>
          </div>
        `
          )
          .join('')}

        <hr style="margin:20px 0;">
        <h3>Request Leave of Absence (PTO Available: ${u.ptoAvailable} Days)</h3>
        <form id="ts-emp-loa-form" class="ts-form-grid">
          <div><label>Start Date</label><input type="date" name="startDate" required></div>
          <div><label>End Date</label><input type="date" name="endDate" required></div>
          <div><label>Days Requested</label><input type="number" name="daysRequested" min="1" max="30" value="1" required></div>
          <div><label>Reason</label><input type="text" name="reason" placeholder="Vacation / Medical / Personal" required></div>
          <div style="display:flex; align-items:flex-end;">
            <button type="submit" class="purple-button" style="width:100%;">Submit LOA</button>
          </div>
        </form>

        <h4>My Leave Requests</h4>
        ${
          myLoas.length === 0
            ? `<div class="empty">No leave requests submitted yet.</div>`
            : myLoas
                .map(
                  (l) => `
              <div class="ts-list-item">
                <span><strong>${l.startDate} to ${l.endDate}</strong> (${l.daysRequested} day(s)) — ${l.reason}</span>
                <span class="ts-badge ${l.status === 'Approved' ? 'green' : l.status === 'Denied' ? 'red' : 'yellow'}">${l.status}</span>
              </div>
            `
                )
                .join('')
        }
      `;

      const loaForm = document.getElementById('ts-emp-loa-form');
      if (loaForm) {
        loaForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(loaForm);
          await api('/api/loa', 'POST', {
            employeeId: u.id,
            startDate: fd.get('startDate'),
            endDate: fd.get('endDate'),
            daysRequested: fd.get('daysRequested'),
            reason: fd.get('reason')
          });
          await loadState('employee');
          renderEmployeeAll();
          showToast('Leave of Absence request submitted.');
        });
      }
    }

    // 4. Employee Progress & Self Performance Review
    const progCards = document.querySelectorAll('#progress .card');
    if (progCards[0]) {
      progCards[0].innerHTML = `
        <h3>Assignment Completion</h3>
        <p><strong>Overall Progress: ${avgPct}%</strong></p>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${avgPct}%;"></div>
        </div>
        ${myTasks
          .map(
            (t) => `
          <div class="ts-list-item">
            <span><strong>${t.title}</strong> (Due: ${t.dueDate})</span>
            <span class="ts-badge ${t.progress === 100 ? 'green' : 'blue'}">${t.progress}%</span>
          </div>
        `
          )
          .join('')}
      `;
    }

    if (progCards[1]) {
      const completedTasks = myTasks.filter((t) => t.progress === 100);
      const myRev = STATE.performanceReviews.find((p) => p.employeeId === u.id) || {
        selfReview: '',
        managerReview: 'Draft Pending',
        finalRating: null
      };

      progCards[1].innerHTML = `
        <h3>Completed Assignments (${completedTasks.length})</h3>
        ${
          completedTasks.length === 0
            ? `<div class="empty">No completed assignments yet.</div>`
            : completedTasks
                .map(
                  (t) => `
              <div class="ts-list-item">
                <span><strong>${t.title}</strong> — Completed</span>
                <span class="ts-badge green">100%</span>
              </div>
            `
                )
                .join('')
        }
        <hr style="margin:20px 0;">
        <h3>Performance Evaluation (Q4 2026)</h3>
        <p><strong>Manager Feedback:</strong> ${myRev.managerReview}</p>
        <p><strong>Final Rating:</strong> ${myRev.finalRating ? `${myRev.finalRating} / 5.0` : 'Pending Manager Review'}</p>
        <form id="ts-self-review-form" class="ts-form-grid">
          <div style="grid-column: 1 / -1;">
            <label>My Self Review Summary</label>
            <input type="text" name="selfReview" value="${myRev.selfReview}" required>
          </div>
          <div>
            <button type="submit" class="purple-button">Submit Self Review</button>
          </div>
        </form>
      `;

      const srForm = document.getElementById('ts-self-review-form');
      if (srForm) {
        srForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const selfReview = srForm.elements.selfReview.value;
          await api(`/api/performance/${u.id}`, 'PUT', { selfReview });
          await loadState('employee');
          renderEmployeeAll();
          showToast('Self review saved.');
        });
      }
    }

    // 5. Employee Chat Form & Inbox
    const senderNameInput = document.getElementById('sender-name');
    const senderEmailInput = document.getElementById('sender-email');
    const recipientEmailInput = document.getElementById('recipient-email');
    if (senderNameInput) { senderNameInput.value = u.name; senderNameInput.readOnly = true; }
    if (senderEmailInput) { senderEmailInput.value = u.email; senderEmailInput.readOnly = true; }
    const directory = STATE.users.filter(
      (x) => x.id !== u.id && (x.role === 'manager' || x.role === 'admin')
    );
    if (recipientEmailInput) {
      let dl = document.getElementById('ts-recipient-list');
      if (!dl) {
        dl = document.createElement('datalist');
        dl.id = 'ts-recipient-list';
        document.body.appendChild(dl);
      }
      dl.innerHTML = directory
        .map((x) => `<option value="${x.email}">${x.name} (${x.role})</option>`)
        .join('');
      recipientEmailInput.setAttribute('list', 'ts-recipient-list');
      if (!recipientEmailInput.value) {
        const firstMgr =
          directory.find((x) => x.email === 'manager@tasksync.com') ||
          directory.find((x) => x.role === 'manager') ||
          directory[0];
        if (firstMgr) recipientEmailInput.value = firstMgr.email;
      }
    }

    const msgForm = document.getElementById('message-form');
    if (msgForm && !msgForm.dataset.bound) {
      msgForm.dataset.bound = 'true';
      msgForm.addEventListener(
        'submit',
        async (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          try {
            await api('/api/messages', 'POST', {
              senderId: u.id,
              senderName: document.getElementById('sender-name').value,
              senderEmail: document.getElementById('sender-email').value,
              recipientEmail: document.getElementById('recipient-email').value,
              text: document.getElementById('message').value
            });
            document.getElementById('message').value = '';
            document.getElementById('message-status').textContent =
              'Message sent!';
            await loadState('employee');
            renderEmployeeAll();
          } catch (err) {
            document.getElementById('message-status').textContent = err.message;
          }
        },
        true
      );
    }

    renderEmployeeInbox();

    // 6. Employee Profile, Settings & Help
    const profCard = document.querySelector('#profile .card');
    if (profCard) {
      profCard.innerHTML = `
        <h3>Employee Information</h3>
        <p><strong>Name:</strong> ${u.name}</p>
        <p><strong>Username:</strong> ${u.username}</p>
        <p><strong>Email:</strong> ${u.email}</p>
        <p><strong>Phone:</strong> ${u.phone}</p>
        <p><strong>Department:</strong> ${u.department}</p>
        <p><strong>Position:</strong> ${u.position}</p>
        <p><strong>Work Type:</strong> ${u.workType}</p>
        <p><strong>Company Join Date:</strong> ${u.joinDate}</p>
        <p><strong>Available PTO:</strong> ${u.ptoAvailable} days</p>
      `;
    }

    const setCard = document.querySelector('#settings .card');
    if (setCard) {
      setCard.innerHTML = `
        <h3>Account Settings</h3>
        <form id="ts-emp-settings-form" class="ts-form-grid">
          <div><label>Name</label><input type="text" name="name" value="${u.name}" required></div>
          <div><label>Email</label><input type="email" name="email" value="${u.email}" required></div>
          <div><label>Phone</label><input type="text" name="phone" value="${u.phone}"></div>
          <div><label>New Password</label><input type="password" name="password" placeholder="Leave blank to keep current"></div>
          <div style="display:flex; align-items:flex-end;">
            <button type="submit" class="purple-button" style="width:100%;">Update Profile</button>
          </div>
        </form>
      `;
      const sf = document.getElementById('ts-emp-settings-form');
      if (sf) {
        sf.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(sf);
          const payload = Object.fromEntries(fd.entries());
          if (!payload.password) delete payload.password;
          const updated = await api(`/api/employees/${u.id}`, 'PUT', payload);
          localStorage.setItem('tasksync_user', JSON.stringify(updated));
          await loadState('employee');
          renderEmployeeAll();
          showToast('Profile settings saved.');
        });
      }
    }

    const helpCard = document.querySelector('#help .card');
    if (helpCard) {
      helpCard.innerHTML = `
        <h3>Need Assistance?</h3>
        <p><strong>IT Support Desk:</strong> 555-555-5555</p>
        <p><strong>HR & Scheduling Inquiries:</strong> Message <code>manager@tasksync.com</code> or <code>admin@tasksync.com</code> in the Chat tab.</p>
      `;
    }
  }

  function decorateEmployeeCalendar() {
    const u = STATE.currentUser;
    if (!u || typeof currentDate === 'undefined') return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const dayCells = document.querySelectorAll(
      '#calendar-grid .calendar-day:not(.blank)'
    );
    dayCells.forEach((cell) => {
      // The page draws the plain day number once. Remember it, because after the
      // first decoration the cell text also contains shift and leave labels.
      if (!cell.dataset.day) cell.dataset.day = String(parseInt(cell.textContent, 10) || '');
      const dayNum = parseInt(cell.dataset.day, 10);
      if (!dayNum) return;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
        dayNum
      ).padStart(2, '0')}`;
      const dow = new Date(year, month, dayNum).getDay();

      cell.innerHTML = `<div>${String(dayNum).padStart(2, '0')}</div>`;

      // Show weekday shift pill
      if (dow >= 1 && dow <= 5) {
        cell.innerHTML += `<span class="shift-pill">${
          u.shift ? u.shift.split('-')[0].trim() : '9:00 AM'
        }</span>`;
      }

      // Custom scheduled shifts
      STATE.schedules
        .filter((s) => s.employeeId === u.id && s.date === dateStr)
        .forEach((s) => {
          cell.innerHTML += `<span class="shift-pill">${s.note}</span>`;
        });

      // LOA requests
      STATE.loaRequests
        .filter(
          (l) =>
            l.employeeId === u.id &&
            dateStr >= l.startDate &&
            dateStr <= l.endDate
        )
        .forEach((l) => {
          cell.innerHTML += `<span class="loa-pill">LOA (${l.status})</span>`;
        });
    });
  }

  // ==================== 5. GLOBAL ACTION HANDLERS ====================
  window.TS = {
    async updateAssignmentProgress(id, progress) {
      let failed = null;
      try {
        await api(`/api/assignments/${id}`, 'PUT', { progress: Number(progress) });
      } catch (err) {
        failed = err.message;
      }
      await loadState(STATE.currentUser.role);
      renderAdminManagerAll(
        STATE.currentUser.role,
        STATE.currentUser.role === 'admin' ? 'red-button' : 'green-button'
      );
      showToast(failed || 'Task progress updated.');
    },
    async deleteAssignment(id) {
      await api(`/api/assignments/${id}`, 'DELETE');
      await loadState(STATE.currentUser.role);
      renderAdminManagerAll(
        STATE.currentUser.role,
        STATE.currentUser.role === 'admin' ? 'red-button' : 'green-button'
      );
      showToast('Assignment deleted.');
    },
    inspectEmployee(empId) {
      STATE.selectedEmployeeId = empId;
      renderAdminManagerAll(
        STATE.currentUser.role,
        STATE.currentUser.role === 'admin' ? 'red-button' : 'green-button'
      );
      if (typeof showScreen === 'function') showScreen('employee-details');
    },
    async removeEmployee(empId) {
      if (!confirm('Remove this employee from the system?')) return;
      await api(`/api/employees/${empId}`, 'DELETE');
      await loadState(STATE.currentUser.role);
      renderAdminManagerAll(
        STATE.currentUser.role,
        STATE.currentUser.role === 'admin' ? 'red-button' : 'green-button'
      );
      showToast('Employee removed.');
    },
    async deleteSchedule(schedId) {
      await api(`/api/schedules/${schedId}`, 'DELETE');
      await loadState(STATE.currentUser.role);
      renderAdminManagerAll(
        STATE.currentUser.role,
        STATE.currentUser.role === 'admin' ? 'red-button' : 'green-button'
      );
      showToast('Shift removed.');
    },
    selectLoa(loaId) {
      STATE.selectedLoaId = loaId;
      renderAdminManagerAll(
        STATE.currentUser.role,
        STATE.currentUser.role === 'admin' ? 'red-button' : 'green-button'
      );
    },
    async decideLoa(loaId, status) {
      let managerNote = '';
      if (status === 'More Info Requested') {
        managerNote =
          prompt('Enter the additional details needed from the employee:') ||
          'Please provide additional details.';
      }
      await api(`/api/loa/${loaId}`, 'PUT', { status, managerNote });
      await loadState(STATE.currentUser.role);
      renderAdminManagerAll(
        STATE.currentUser.role,
        STATE.currentUser.role === 'admin' ? 'red-button' : 'green-button'
      );
      showToast(`Leave request marked as ${status}.`);
    },
    async quickAttendance(employeeId, status) {
      const nowTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      await api('/api/attendance', 'POST', {
        employeeId,
        clockIn: status === 'On Leave' ? '--' : nowTime,
        clockOut: '--',
        totalHours: status === 'On Leave' ? 0 : 8,
        status
      });
      await loadState(STATE.currentUser.role);
      renderAdminManagerAll(
        STATE.currentUser.role,
        STATE.currentUser.role === 'admin' ? 'red-button' : 'green-button'
      );
      showToast('Attendance updated.');
    },
    async savePerformance(employeeId) {
      const managerReview = document.getElementById(`mgr-rev-${employeeId}`).value;
      const finalRating = document.getElementById(`mgr-rate-${employeeId}`).value;
      await api(`/api/performance/${employeeId}`, 'PUT', {
        managerReview,
        finalRating
      });
      await loadState(STATE.currentUser.role);
      renderAdminManagerAll(
        STATE.currentUser.role,
        STATE.currentUser.role === 'admin' ? 'red-button' : 'green-button'
      );
      showToast('Performance review saved.');
    },
    async generateReport(type) {
      await api('/api/reports', 'POST', { type });
      await loadState('admin');
      renderAdminManagerAll('admin', 'red-button');
      showToast(`${type} generated.`);
    },
    exportReportCSV(reportId) {
      const rep = STATE.reports.find((r) => r.id === reportId);
      if (!rep) return;
      const csv = `Report Name,Report Type,Date Generated,Status,Summary\n"${rep.name}","${rep.type}","${rep.dateGenerated}","${rep.status}","${rep.summary}"\n`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${rep.name.replace(/\s+/g, '_')}.csv`;
      a.click();
    },
    async deleteReport(reportId) {
      await api(`/api/reports/${reportId}`, 'DELETE');
      await loadState('admin');
      renderAdminManagerAll('admin', 'red-button');
      showToast('Report deleted.');
    },
    selectChatPartner(userId) {
      STATE.selectedChatPartnerId = userId;
      renderAMChat(
        STATE.currentUser.role,
        STATE.currentUser.role === 'admin' ? 'red-button' : 'green-button'
      );
    },
    async empClock(action) {
      await api('/api/attendance', 'POST', {
        employeeId: STATE.currentUser.id,
        action
      });
      await loadState('employee');
      renderEmployeeAll();
      showToast(action === 'clock-in' ? 'Clocked in!' : 'Clocked out!');
    },
    async empUpdateTask(taskId, progress) {
      let failed = null;
      try {
        await api(`/api/assignments/${taskId}`, 'PUT', {
          progress: Number(progress)
        });
      } catch (err) {
        failed = err.message;
      }
      await loadState('employee');
      renderEmployeeAll();
      showToast(failed || `Progress updated to ${progress}%.`);
    }
  };

  // ==================== LOGOUT ====================
  // Every portal has a sidebar Logout button. End the server session first,
  // then return to the login page.
  document.addEventListener(
    'click',
    async function (e) {
      const btn = e.target.closest && e.target.closest('.nav-button');
      if (!btn || !/logout/i.test(btn.textContent)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      } catch (err) {}
      try { localStorage.removeItem('tasksync_user'); } catch (err) {}
      window.location.href = '/';
    },
    true
  );

  // ==================== LIVE REFRESH ====================
  // Every few seconds, check whether anything changed on the server (a new task,
  // a message, a status update) and refresh the screen. It never refreshes while
  // someone is typing, so nothing they have started writing is lost.
  function startLiveRefresh(role) {
    const btnClass = role === 'admin' ? 'red-button' : 'green-button';
    // A box counts as "being typed in" only if a person edited it and it still has text
    document.addEventListener('input', function (ev) {
      if (ev.target && ev.target.dataset) ev.target.dataset.tsTyped = '1';
    }, true);
    // Once a form is submitted its boxes no longer count as unfinished drafts
    document.addEventListener('submit', function (ev) {
      const f = ev.target;
      if (f && f.querySelectorAll) f.querySelectorAll('[data-ts-typed]').forEach((el) => { delete el.dataset.tsTyped; });
    }, true);
    function hasUnsavedText() {
      return Array.from(
        document.querySelectorAll('input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea')
      ).some((el) => el.dataset.tsTyped === '1' && el.value !== '' && !el.closest('.topbar'));
    }
    setInterval(async () => {
      if (document.hidden || !STATE.currentUser) return;
      try {
        const res = await fetch('/api/bootstrap', { credentials: 'same-origin' });
        if (res.status === 401) {
          try { localStorage.removeItem('tasksync_user'); } catch (e) {}
          window.location.href = '/';
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const sig = JSON.stringify(data);
        if (sig === STATE.sig) return;
        if (hasUnsavedText()) return; // try again on the next check
        const oldIds = new Set(STATE.messages.map((m) => m.id));
        const fresh = (data.messages || []).filter(
          (m) => !oldIds.has(m.id) && m.recipientId === STATE.currentUser.id
        );
        await loadState(role);
        if (role === 'employee') renderEmployeeAll();
        else renderAdminManagerAll(role, btnClass);
        const thread = document.querySelector('#chat .ts-chat-thread');
        if (thread) thread.scrollTop = thread.scrollHeight;
        if (fresh.length) showToast('New message from ' + fresh[fresh.length - 1].senderName);
      } catch (e) {
        /* network hiccup: try again on the next check */
      }
    }, 8000);
  }

  // ==================== 6. BOOTSTRAP BY PAGE ====================
  if (pathName.includes('administrator.html')) {
    initAdminOrManagerPortal('admin');
    startLiveRefresh('admin');
  } else if (pathName.includes('manager.html')) {
    initAdminOrManagerPortal('manager');
    startLiveRefresh('manager');
  } else if (pathName.includes('employee.html')) {
    initEmployeePortal();
    startLiveRefresh('employee');
  } else {
    initLoginPage();
  }
})();