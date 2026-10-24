/**
 * HCM Lite - Storage Manager
 * Handles all browser localStorage read/write operations with safety checks.
 * Storage keys:
 * - hcm_company: Company configuration and settings
 * - hcm_users: User accounts (Admin and Employees)
 * - hcm_attendance: Daily attendance records
 * - hcm_leaves: Leave requests and history
 * - hcm_session: Current logged-in user session
 * - hcm_announcements: Company-wide announcements
 * - hcm_activity: Recent audit activity logs
 */

const HCM_KEYS = {
  COMPANY: 'hcm_company',
  USERS: 'hcm_users',
  ATTENDANCE: 'hcm_attendance',
  LEAVES: 'hcm_leaves',
  SESSION: 'hcm_session',
  ANNOUNCEMENTS: 'hcm_announcements',
  ACTIVITY: 'hcm_activity',
  THEME: 'hcm_theme'
};

const Storage = {
  /**
   * Safe getter from localStorage
   * @param {string} key 
   * @param {*} defaultValue 
   * @returns {*} parsed JSON or defaultValue
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === undefined || item === '') {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`[Storage] Error reading key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Safe setter to localStorage
   * @param {string} key 
   * @param {*} value 
   * @returns {boolean} success
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[Storage] Error writing key "${key}":`, error);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   * @param {string} key 
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[Storage] Error removing key "${key}":`, error);
    }
  },

  /**
   * Clear all HCM data
   */
  clearAll() {
    Object.values(HCM_KEYS).forEach(key => localStorage.removeItem(key));
  },

  /**
   * Checks if application is in first-run state (no company or admin created yet)
   * @returns {boolean}
   */
  isFirstRun() {
    const company = this.getCompany();
    const users = this.getUsers();
    const hasAdmin = Array.isArray(users) && users.some(u => u.role === 'Admin');
    return !company || !hasAdmin;
  },

  // Company Settings
  getCompany() {
    return this.get(HCM_KEYS.COMPANY, null);
  },

  saveCompany(companyData) {
    return this.set(HCM_KEYS.COMPANY, companyData);
  },

  // Users (Admin and Employees)
  getUsers() {
    return this.get(HCM_KEYS.USERS, []);
  },

  saveUsers(users) {
    return this.set(HCM_KEYS.USERS, users);
  },

  getUserById(id) {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  },

  getUserByEmail(email) {
    if (!email) return null;
    const users = this.getUsers();
    return users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase()) || null;
  },

  // Attendance
  getAttendance() {
    return this.get(HCM_KEYS.ATTENDANCE, []);
  },

  saveAttendance(attendanceList) {
    return this.set(HCM_KEYS.ATTENDANCE, attendanceList);
  },

  // Leaves
  getLeaves() {
    return this.get(HCM_KEYS.LEAVES, []);
  },

  saveLeaves(leaveList) {
    return this.set(HCM_KEYS.LEAVES, leaveList);
  },

  // Session
  getSession() {
    return this.get(HCM_KEYS.SESSION, null);
  },

  setSession(user) {
    // Only store safe session info (exclude sensitive data if needed, but keep role and id)
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      loginTime: new Date().toISOString()
    };
    return this.set(HCM_KEYS.SESSION, sessionData);
  },

  clearSession() {
    this.remove(HCM_KEYS.SESSION);
  },

  // Announcements
  getAnnouncements() {
    return this.get(HCM_KEYS.ANNOUNCEMENTS, []);
  },

  saveAnnouncements(list) {
    return this.set(HCM_KEYS.ANNOUNCEMENTS, list);
  },

  // Recent Activity / Audit Log
  getActivity() {
    return this.get(HCM_KEYS.ACTIVITY, []);
  },

  addActivity(action, details, userName = 'System') {
    const logs = this.getActivity();
    const newLog = {
      id: 'act_' + Date.now(),
      action,
      details,
      userName,
      timestamp: new Date().toISOString()
    };
    // Keep last 50 activities
    logs.unshift(newLog);
    if (logs.length > 50) logs.pop();
    this.set(HCM_KEYS.ACTIVITY, logs);
  }
};
