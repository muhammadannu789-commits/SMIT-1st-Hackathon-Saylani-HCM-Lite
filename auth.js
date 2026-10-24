/**
 * HCM Lite - Authentication & Authorization Manager
 * Handles first-run setup, login, logout, password changes,
 * role-based access control, and route guards.
 */

const Auth = {
  /**
   * Enforce page access protection
   * @param {string|null} requiredRole 'Admin' | 'Employee' | null
   */
  protectPage(requiredRole = null) {
    const session = Storage.getSession();
    const isFirstRun = Storage.isFirstRun();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // If first run, must go to index.html
    if (isFirstRun) {
      if (currentPage !== 'index.html') {
        window.location.replace('index.html');
        return null;
      }
      return null;
    }

    // If on index.html and already logged in, redirect to respective dashboard
    if (currentPage === 'index.html' || currentPage === '') {
      if (session) {
        if (session.role === 'Admin') {
          window.location.replace('admin.html');
        } else {
          window.location.replace('employee.html');
        }
      }
      return session;
    }

    // If not logged in and trying to access any internal page
    if (!session) {
      window.location.replace('index.html');
      return null;
    }

    // Verify session user still exists in database
    const user = Storage.getUserById(session.id);
    if (!user) {
      Storage.clearSession();
      window.location.replace('index.html');
      return null;
    }

    // Role-based route guard
    if (requiredRole && session.role !== requiredRole) {
      console.warn(`[Auth] Access denied for role: ${session.role}. Required: ${requiredRole}`);
      if (session.role === 'Admin') {
        window.location.replace('admin.html');
      } else {
        window.location.replace('employee.html');
      }
      return null;
    }

    // Update UI elements with logged-in user profile
    this.renderUserProfile(session);

    return session;
  },

  /**
   * First-run application setup
   */
  firstRunSetup({ companyName, adminName, adminEmail, adminPassword, confirmPassword }) {
    if (!companyName || !adminName || !adminEmail || !adminPassword || !confirmPassword) {
      return { success: false, error: 'All fields are required.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail.trim())) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (adminPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (adminPassword !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }

    // Check if email already used (if any users exist)
    const existing = Storage.getUserByEmail(adminEmail);
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    // Initialize company settings with sensible defaults
    const companyData = {
      name: companyName.trim(),
      officeStartTime: '09:00',
      graceMinutes: 15,
      yearlyLeaveQuota: 20,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      createdAt: new Date().toISOString()
    };
    Storage.saveCompany(companyData);

    // Create Admin user
    const adminUser = {
      id: 'admin_' + Date.now(),
      name: adminName.trim(),
      email: adminEmail.trim().toLowerCase(),
      password: adminPassword,
      role: 'Admin',
      department: 'Executive Administration',
      salary: 150000,
      createdAt: new Date().toISOString()
    };
    Storage.saveUsers([adminUser]);

    // Set active session
    Storage.setSession(adminUser);

    // Audit activity
    Storage.addActivity('First-Run Setup', `Company "${companyName}" configured and Admin account created.`, adminUser.name);

    return { success: true, user: adminUser };
  },

  /**
   * User login
   */
  login(email, password) {
    if (!email || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    const user = Storage.getUserByEmail(email.trim());
    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (user.password !== password) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Set session
    Storage.setSession(user);
    Storage.addActivity('User Login', `${user.name} (${user.role}) logged in.`, user.name);

    return { success: true, user };
  },

  /**
   * User logout
   */
  logout() {
    const session = Storage.getSession();
    if (session) {
      Storage.addActivity('User Logout', `${session.name} logged out.`, session.name);
    }
    Storage.clearSession();
    window.location.replace('index.html');
  },

  /**
   * Change Password
   */
  changePassword(userId, currentPassword, newPassword, confirmPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, error: 'All password fields are required.' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'New passwords do not match.' };
    }

    const users = Storage.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, error: 'User account not found.' };
    }

    if (users[userIndex].password !== currentPassword) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    users[userIndex].password = newPassword;
    Storage.saveUsers(users);
    Storage.addActivity('Password Changed', `Password updated for ${users[userIndex].name}.`, users[userIndex].name);

    return { success: true };
  },

  /**
   * Render user details in sidebar/navbar
   */
  renderUserProfile(session) {
    document.addEventListener('DOMContentLoaded', () => {
      // Company brand elements
      const company = Storage.getCompany();
      const companyElements = document.querySelectorAll('.company-name-display');
      companyElements.forEach(el => {
        el.textContent = company?.name || 'HCM Lite';
      });

      // User name and role display
      const userNameEls = document.querySelectorAll('.user-name-display');
      userNameEls.forEach(el => {
        el.textContent = session.name;
      });

      const userRoleEls = document.querySelectorAll('.user-role-display');
      userRoleEls.forEach(el => {
        el.textContent = session.role;
      });

      const userEmailEls = document.querySelectorAll('.user-email-display');
      userEmailEls.forEach(el => {
        el.textContent = session.email;
      });

      // User Avatar initials
      const userAvatarEls = document.querySelectorAll('.user-avatar-initials');
      const initials = session.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
      userAvatarEls.forEach(el => {
        el.textContent = initials;
      });

      // Bind logout buttons
      const logoutBtns = document.querySelectorAll('.btn-logout');
      logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (confirm('Are you sure you want to sign out?')) {
            Auth.logout();
          }
        });
      });

      // Bind Change Password modal triggers
      const changePassModalEl = document.getElementById('changePasswordModal');
      const changePassForm = document.getElementById('changePasswordForm');
      if (changePassForm) {
        changePassForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const curr = document.getElementById('currentPasswordInput').value;
          const next = document.getElementById('newPasswordInput').value;
          const conf = document.getElementById('confirmNewPasswordInput').value;
          const errDiv = document.getElementById('changePasswordError');

          const res = Auth.changePassword(session.id, curr, next, conf);
          if (!res.success) {
            if (errDiv) {
              errDiv.textContent = res.error;
              errDiv.classList.remove('d-none');
            }
          } else {
            if (errDiv) errDiv.classList.add('d-none');
            changePassForm.reset();
            const modalInstance = bootstrap.Modal.getInstance(changePassModalEl);
            if (modalInstance) modalInstance.hide();
            Helper.showToast('Password changed successfully!', 'success');
          }
        });
      }
    });
  }
};
