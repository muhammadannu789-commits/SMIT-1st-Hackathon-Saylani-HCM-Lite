/**
 * HCM Lite - Company Settings Management
 * Handles reading and updating company settings, office hours,
 * grace period, leave quotas, and working days.
 */

const SettingsManager = {
  /**
   * Get current company settings or defaults
   */
  getSettings() {
    const existing = Storage.getCompany();
    if (existing) return existing;

    const defaults = {
      name: 'Saylani HCM Lite',
      officeStartTime: '09:00',
      graceMinutes: 15,
      yearlyLeaveQuota: 20,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      createdAt: new Date().toISOString()
    };
    Storage.saveCompany(defaults);
    return defaults;
  },

  /**
   * Save updated settings
   */
  saveSettings(formData) {
    const { name, officeStartTime, graceMinutes, yearlyLeaveQuota, workingDays } = formData;

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Company name cannot be blank.' };
    }

    if (!officeStartTime) {
      return { success: false, error: 'Office start time is required.' };
    }

    const grace = parseInt(graceMinutes, 10);
    if (isNaN(grace) || grace < 0) {
      return { success: false, error: 'Grace minutes must be 0 or greater.' };
    }

    const quota = parseInt(yearlyLeaveQuota, 10);
    if (isNaN(quota) || quota <= 0) {
      return { success: false, error: 'Yearly leave quota must be a positive number.' };
    }

    if (!Array.isArray(workingDays) || workingDays.length === 0) {
      return { success: false, error: 'Please select at least one working day.' };
    }

    const existing = this.getSettings();
    const updated = {
      ...existing,
      name: name.trim(),
      officeStartTime: officeStartTime.trim(),
      graceMinutes: grace,
      yearlyLeaveQuota: quota,
      workingDays: workingDays,
      updatedAt: new Date().toISOString()
    };

    Storage.saveCompany(updated);

    const session = Storage.getSession();
    Storage.addActivity('Settings Updated', `Company settings updated by ${session?.name || 'Admin'}.`, session?.name || 'Admin');

    return { success: true, settings: updated };
  },

  /**
   * Reset all demo data to fresh first-run state
   */
  resetAllData() {
    Storage.clearAll();
    window.location.replace('index.html');
  }
};
