/**
 * HCM Lite - Leave Management
 * Handles leave applications, business rule checks (working days, overlaps, quota),
 * and Admin approvals/rejections with comments.
 */

const LeaveManager = {
  LEAVE_TYPES: ['Annual Leave', 'Casual Leave', 'Sick Leave', 'Unpaid Leave'],

  /**
   * Calculate leave balance summary for an employee
   */
  getLeaveBalance(employeeId) {
    const company = Storage.getCompany() || { yearlyLeaveQuota: 20 };
    const quota = Number(company.yearlyLeaveQuota) || 20;

    const leaves = Storage.getLeaves();
    const currentYear = new Date().getFullYear();

    // Sum approved working days in current year
    const approvedDays = leaves
      .filter(l => {
        if (l.employeeId !== employeeId || l.status !== 'Approved') return false;
        const leaveYear = new Date(l.startDate + 'T00:00:00').getFullYear();
        return leaveYear === currentYear;
      })
      .reduce((sum, l) => sum + (Number(l.workingDaysCount) || 0), 0);

    const pendingDays = leaves
      .filter(l => {
        if (l.employeeId !== employeeId || l.status !== 'Pending') return false;
        const leaveYear = new Date(l.startDate + 'T00:00:00').getFullYear();
        return leaveYear === currentYear;
      })
      .reduce((sum, l) => sum + (Number(l.workingDaysCount) || 0), 0);

    const remaining = Math.max(0, quota - approvedDays);

    return {
      quota,
      approvedDays,
      pendingDays,
      remaining
    };
  },

  /**
   * Apply for leave (by Employee)
   */
  applyLeave({ employee, leaveType, startDate, endDate, reason }) {
    if (!employee || !employee.id) {
      return { success: false, error: 'Invalid user session.' };
    }

    if (!leaveType || !startDate || !endDate || !reason || reason.trim() === '') {
      return { success: false, error: 'All fields are required.' };
    }

    // Rule: Start date cannot be after end date
    if (startDate > endDate) {
      return { success: false, error: 'Start date cannot be after end date.' };
    }

    const company = Storage.getCompany() || {
      yearlyLeaveQuota: 20,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    };

    // Rule: Count working days only and skip non-working days
    const workingDaysCount = Helper.countWorkingDaysBetween(startDate, endDate, company.workingDays);
    if (workingDaysCount <= 0) {
      return { success: false, error: 'Selected date range contains no company working days.' };
    }

    // Rule: Prevent overlapping leave requests with existing Pending or Approved leaves
    const leaves = Storage.getLeaves();
    const hasOverlap = leaves.some(l => {
      if (l.employeeId !== employee.id) return false;
      if (l.status === 'Rejected') return false; // Rejected leaves don't block
      // Check interval intersection: max(start1, start2) <= min(end1, end2)
      return (startDate <= l.endDate) && (endDate >= l.startDate);
    });

    if (hasOverlap) {
      return { success: false, error: 'You already have a pending or approved leave request during these dates.' };
    }

    // Rule: Prevent approved leave from exceeding yearly quota
    const balance = this.getLeaveBalance(employee.id);
    if (leaveType !== 'Unpaid Leave' && workingDaysCount > balance.remaining) {
      return {
        success: false,
        error: `Insufficient leave balance! You requested ${workingDaysCount} working day(s), but only have ${balance.remaining} day(s) remaining.`
      };
    }

    const newRequest = {
      id: 'leave_' + Date.now(),
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department || 'General',
      leaveType,
      startDate,
      endDate,
      workingDaysCount,
      reason: reason.trim(),
      status: 'Pending',
      adminComment: '',
      appliedAt: new Date().toISOString(),
      decidedAt: null
    };

    leaves.unshift(newRequest);
    Storage.saveLeaves(leaves);

    Storage.addActivity('Leave Applied', `${employee.name} requested ${workingDaysCount} day(s) of ${leaveType}.`, employee.name);

    return { success: true, leave: newRequest };
  },

  /**
   * Admin approves a leave request
   */
  approveLeave(leaveId, adminComment = '') {
    const leaves = Storage.getLeaves();
    const index = leaves.findIndex(l => l.id === leaveId);
    if (index === -1) return { success: false, error: 'Leave request not found.' };

    const leave = leaves[index];
    if (leave.status === 'Approved') {
      return { success: false, error: 'This request is already approved.' };
    }

    // Check quota before final approval
    if (leave.leaveType !== 'Unpaid Leave') {
      const balance = this.getLeaveBalance(leave.employeeId);
      if (leave.workingDaysCount > balance.remaining) {
        return {
          success: false,
          error: `Cannot approve: Employee only has ${balance.remaining} day(s) remaining in quota.`
        };
      }
    }

    leave.status = 'Approved';
    leave.adminComment = adminComment.trim();
    leave.decidedAt = new Date().toISOString();

    Storage.saveLeaves(leaves);

    const session = Storage.getSession();
    Storage.addActivity('Leave Approved', `Approved ${leave.leaveType} for ${leave.employeeName} (${leave.workingDaysCount} days).`, session?.name || 'Admin');

    return { success: true, leave };
  },

  /**
   * Admin rejects a leave request
   */
  rejectLeave(leaveId, adminComment = '') {
    const leaves = Storage.getLeaves();
    const index = leaves.findIndex(l => l.id === leaveId);
    if (index === -1) return { success: false, error: 'Leave request not found.' };

    const leave = leaves[index];
    if (leave.status === 'Rejected') {
      return { success: false, error: 'This request is already rejected.' };
    }

    leave.status = 'Rejected';
    leave.adminComment = adminComment.trim() || 'Request rejected by administrator.';
    leave.decidedAt = new Date().toISOString();

    Storage.saveLeaves(leaves);

    const session = Storage.getSession();
    Storage.addActivity('Leave Rejected', `Rejected ${leave.leaveType} for ${leave.employeeName}. Reason: ${leave.adminComment}`, session?.name || 'Admin');

    return { success: true, leave };
  }
};
