/**
 * HCM Lite - Helper Utilities
 * Provides date/time formatting, business rule calculations,
 * notification toasts, modal dialogs, and the Smart Helper chat engine.
 */

const Helper = {
  // Day names for matching company working days
  DAY_NAMES: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

  /**
   * Get current date in YYYY-MM-DD format
   */
  getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Get current time in HH:MM:SS format
   */
  getCurrentTimeString() {
    const now = new Date();
    return now.toTimeString().split(' ')[0]; // "09:30:15"
  },

  /**
   * Format YYYY-MM-DD into human-readable format e.g. "Oct 24, 2026"
   */
  formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  },

  /**
   * Format HH:MM:SS or HH:MM into 12-hour format e.g. "09:15 AM"
   */
  formatTime(timeStr) {
    if (!timeStr) return '--:--';
    try {
      const [h, m] = timeStr.split(':');
      let hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12; // 0 becomes 12
      return `${String(hour).padStart(2, '0')}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  },

  /**
   * Format ISO string to readable Date & Time
   */
  formatDateTime(isoStr) {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  },

  /**
   * Format currency (PKR)
   */
  formatCurrency(amount) {
    const val = Number(amount) || 0;
    return 'PKR ' + val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  },

  /**
   * Check if a given Date object or string is a configured working day
   */
  isWorkingDay(dateInput, workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
    const d = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : new Date(dateInput);
    const dayName = this.DAY_NAMES[d.getDay()];
    return Array.isArray(workingDays) && workingDays.includes(dayName);
  },

  /**
   * Count working days between two YYYY-MM-DD dates inclusive
   */
  countWorkingDaysBetween(startDateStr, endDateStr, workingDays) {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');
    if (start > end) return 0;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      if (this.isWorkingDay(cur, workingDays)) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  },

  /**
   * Get total working days in a given month (1-indexed month: 1 = Jan, 10 = Oct)
   */
  getWorkingDaysInMonth(year, month, workingDays) {
    const totalDays = new Date(year, month, 0).getDate();
    let workingCount = 0;
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month - 1, day);
      if (this.isWorkingDay(d, workingDays)) {
        workingCount++;
      }
    }
    return workingCount;
  },

  /**
   * Calculate duration in hours between checkIn and checkOut
   * @param {string} checkIn "09:05:00"
   * @param {string} checkOut "17:15:00"
   * @returns {number} duration in decimal hours (e.g. 8.16)
   */
  calculateDurationHours(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 0;
    try {
      const [h1, m1, s1 = 0] = checkIn.split(':').map(Number);
      const [h2, m2, s2 = 0] = checkOut.split(':').map(Number);

      const d1 = new Date();
      d1.setHours(h1, m1, s1, 0);

      const d2 = new Date();
      d2.setHours(h2, m2, s2, 0);

      const diffMs = d2 - d1;
      if (diffMs < 0) return 0;
      const hours = diffMs / (1000 * 60 * 60);
      return Math.round(hours * 100) / 100;
    } catch {
      return 0;
    }
  },

  /**
   * Determine whether check-in time is Late
   * @param {string} checkIn "09:20:00"
   * @param {string} officeStart "09:00"
   * @param {number} graceMinutes 15
   * @returns {boolean} true if late
   */
  isLateCheckIn(checkIn, officeStart = "09:00", graceMinutes = 15) {
    try {
      const [inH, inM] = checkIn.split(':').map(Number);
      const [startH, startM] = officeStart.split(':').map(Number);

      const inTotalMinutes = inH * 60 + inM;
      const thresholdMinutes = startH * 60 + startM + Number(graceMinutes);

      return inTotalMinutes > thresholdMinutes;
    } catch {
      return false;
    }
  },

  /**
   * Display floating toast notification
   * @param {string} message 
   * @param {string} type 'success' | 'danger' | 'warning' | 'info'
   */
  showToast(message, type = 'success') {
    let container = document.getElementById('hcm-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'hcm-toast-container';
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      container.style.zIndex = '99999';
      document.body.appendChild(container);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-bg-${type} border-0 shadow-lg show`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.style.marginBottom = '8px';

    const iconMap = {
      success: 'bi-check-circle-fill',
      danger: 'bi-exclamation-triangle-fill',
      warning: 'bi-exclamation-circle-fill',
      info: 'bi-info-circle-fill'
    };
    const icon = iconMap[type] || 'bi-info-circle-fill';

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon} fs-5"></i>
          <div>${message}</div>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    container.appendChild(toastEl);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 300);
    }, 4000);

    // Close button action
    const closeBtn = toastEl.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.remove(), 300);
      });
    }
  },

  /**
   * Clean status badge generator
   */
  getStatusBadge(status) {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'present':
        return '<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i class="bi bi-check-circle me-1"></i>Present</span>';
      case 'late':
        return '<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1"><i class="bi bi-clock-history me-1"></i>Late</span>';
      case 'half day':
      case 'halfday':
        return '<span class="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2 py-1"><i class="bi bi-hourglass-split me-1"></i>Half Day</span>';
      case 'absent':
        return '<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"><i class="bi bi-x-circle me-1"></i>Absent</span>';
      case 'approved':
        return '<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i class="bi bi-check-lg me-1"></i>Approved</span>';
      case 'pending':
        return '<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1"><i class="bi bi-hourglass-top me-1"></i>Pending</span>';
      case 'rejected':
        return '<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"><i class="bi bi-slash-circle me-1"></i>Rejected</span>';
      case 'on leave':
        return '<span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1"><i class="bi bi-calendar-event me-1"></i>On Leave</span>';
      default:
        return `<span class="badge bg-secondary-subtle text-secondary px-2 py-1">${status || 'Unknown'}</span>`;
    }
  },

  /**
   * Smart Helper Chat Engine
   * Keyword-based rule processor that inspects actual localStorage data
   * and respects strict role-based access.
   */
  processSmartHelperQuery(query, currentUser) {
    if (!query || typeof query !== 'string') return "Please enter a question.";
    const q = query.trim().toLowerCase();
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const isEmployee = currentUser && currentUser.role === 'Employee';

    const company = Storage.getCompany() || {
      name: 'HCM Lite Demo',
      officeStartTime: '09:00',
      graceMinutes: 15,
      yearlyLeaveQuota: 20,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    };
    const today = this.getTodayDateString();
    const attendanceRecords = Storage.getAttendance();
    const allUsers = Storage.getUsers();
    const employees = allUsers.filter(u => u.role === 'Employee');
    const leaves = Storage.getLeaves();

    // ----------------- ADMIN QUERIES -----------------
    if (isAdmin) {
      // 1. "How many employees do we have?"
      if (q.includes('how many employee') || q.includes('total employee') || q.includes('employee count') || q.includes('number of employee')) {
        return `We currently have **${employees.length}** registered employee${employees.length === 1 ? '' : 's'}.`;
      }

      // 2. "Who is on leave today?"
      if (q.includes('on leave today') || q.includes('who is on leave') || q.includes('leave today')) {
        const onLeaveList = leaves.filter(l => {
          return l.status === 'Approved' && l.startDate <= today && l.endDate >= today;
        });
        if (onLeaveList.length === 0) {
          return `No employees are on approved leave today (${this.formatDate(today)}).`;
        }
        const names = onLeaveList.map(l => `${l.employeeName} (${l.leaveType})`).join(', ');
        return `**${onLeaveList.length}** employee${onLeaveList.length > 1 ? 's' : ''} on leave today: ${names}.`;
      }

      // 3. "Who was late today?" / "Late today"
      if (q.includes('late today') || q.includes('who was late') || q.includes('who is late')) {
        const todayLate = attendanceRecords.filter(r => r.date === today && r.status === 'Late');
        if (todayLate.length === 0) {
          return `No employees arrived late today. Everyone checked in on time!`;
        }
        const names = todayLate.map(r => `${r.employeeName} (at ${this.formatTime(r.checkInTime)})`).join(', ');
        return `**${todayLate.length}** employee${todayLate.length > 1 ? 's were' : ' was'} late today: ${names}.`;
      }

      // 4. "How many employees are present today?"
      if (q.includes('present today') || q.includes('checked in today') || q.includes('how many present')) {
        const todayPresent = attendanceRecords.filter(r => r.date === today && r.checkInTime);
        return `**${todayPresent.length}** out of ${employees.length} employee${employees.length === 1 ? '' : 's'} are present today.`;
      }

      // 5. "How many leave requests are pending?"
      if (q.includes('leave request') && (q.includes('pending') || q.includes('how many'))) {
        const pending = leaves.filter(l => l.status === 'Pending');
        return `There ${pending.length === 1 ? 'is' : 'are'} **${pending.length}** pending leave request${pending.length === 1 ? '' : 's'} waiting for your review.`;
      }

      // General fallback for Admin
      return `I can help you with company statistics! Try asking:
- *"How many employees do we have?"*
- *"Who is on leave today?"*
- *"Who was late today?"*
- *"How many employees are present today?"*
- *"How many leave requests are pending?"*`;
    }

    // ----------------- EMPLOYEE QUERIES -----------------
    if (isEmployee) {
      const myId = currentUser.id;
      const myApprovedLeaves = leaves.filter(l => l.employeeId === myId && l.status === 'Approved');
      const usedDays = myApprovedLeaves.reduce((acc, curr) => acc + (Number(curr.workingDaysCount) || 0), 0);
      const quota = Number(company.yearlyLeaveQuota) || 20;
      const remainingLeaves = Math.max(0, quota - usedDays);

      // Security check: If employee tries to ask about other people or salaries:
      if (q.includes('salary of') || q.includes('salaries') || (q.includes('salary') && !q.includes('my salary')) || q.includes('other employee')) {
        return "⚠️ **Access Denied**: As an Employee, you can only query your own personal HCM records.";
      }

      // 1. "How many leaves do I have left?"
      if (q.includes('leave') && (q.includes('left') || q.includes('remaining') || q.includes('balance') || q.includes('quota'))) {
        return `You have **${remainingLeaves}** day${remainingLeaves === 1 ? '' : 's'} of leave remaining this year (Used: ${usedDays} / Total Quota: ${quota}).`;
      }

      // 2. "Was I late today?"
      if (q.includes('late today') || q.includes('was i late') || q.includes('am i late')) {
        const myRecordToday = attendanceRecords.find(r => r.employeeId === myId && r.date === today);
        if (!myRecordToday) {
          return "You haven't checked in yet today.";
        }
        if (myRecordToday.status === 'Late') {
          return `Yes, you were marked **Late** today. Check-in was recorded at ${this.formatTime(myRecordToday.checkInTime)}.`;
        }
        return `No, you were on time! Check-in recorded at ${this.formatTime(myRecordToday.checkInTime)} (Status: ${myRecordToday.status}).`;
      }

      // 3. "How many hours did I work this week?"
      if (q.includes('hours') && (q.includes('week') || q.includes('work') || q.includes('worked'))) {
        // Calculate current week start (Sunday or Monday)
        const now = new Date();
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const myWeeklyRecords = attendanceRecords.filter(r => {
          if (r.employeeId !== myId || !r.durationHours) return false;
          const rDate = new Date(r.date + 'T00:00:00');
          return rDate >= firstDayOfWeek && rDate <= now;
        });

        const totalHours = myWeeklyRecords.reduce((sum, r) => sum + (Number(r.durationHours) || 0), 0);
        return `You have logged **${totalHours.toFixed(1)} hours** across ${myWeeklyRecords.length} completed shift${myWeeklyRecords.length === 1 ? '' : 's'} this week.`;
      }

      // 4. "What is my attendance today?"
      if (q.includes('attendance today') || q.includes('my attendance') || q.includes('status today')) {
        const myRecordToday = attendanceRecords.find(r => r.employeeId === myId && r.date === today);
        if (!myRecordToday) {
          return "You have not checked in yet today. Don't forget to press the Check-In button on your dashboard!";
        }
        let msg = `Your attendance today (${this.formatDate(today)}):\n` +
          `• Check-In: **${this.formatTime(myRecordToday.checkInTime)}**\n` +
          `• Check-Out: **${myRecordToday.checkOutTime ? this.formatTime(myRecordToday.checkOutTime) : 'Not checked out yet'}**\n` +
          `• Status: **${myRecordToday.status}**`;
        if (myRecordToday.durationHours) {
          msg += `\n• Hours worked: **${myRecordToday.durationHours} hrs**`;
        }
        return msg;
      }

      // 5. "My salary" or "payslip"
      if (q.includes('my salary') || q.includes('my payslip')) {
        const myUser = allUsers.find(u => u.id === myId);
        return `Your registered monthly salary is **${this.formatCurrency(myUser?.salary || 0)}**. You can view and print your detailed monthly payslip from the **My Payslip** page.`;
      }

      // General fallback for Employee
      return `Hi ${currentUser.name}! I can answer questions about your personal work records. Try asking:
- *"How many leaves do I have left?"*
- *"Was I late today?"*
- *"How many hours did I work this week?"*
- *"What is my attendance today?"*`;
    }

    return "Please log in to use the Smart Helper.";
  }
};
