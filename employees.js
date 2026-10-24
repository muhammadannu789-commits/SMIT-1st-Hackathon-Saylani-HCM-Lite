/**
 * HCM Lite - Employee Management
 * Admin CRUD operations for employees with inline validation,
 * search, department filtering, and cascading record deletion.
 */

const EmployeeManager = {
  departments: ['Engineering', 'Human Resources', 'Sales', 'Marketing', 'Finance', 'Operations', 'Design'],

  /**
   * Get all employees (excluding Admins)
   */
  getAll() {
    const users = Storage.getUsers();
    return users.filter(u => u.role === 'Employee');
  },

  /**
   * Add a new employee
   */
  addEmployee(data) {
    const { name, email, password, department, salary } = data;
    const errors = this.validate(data);

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    // Check unique email across all users
    const existing = Storage.getUserByEmail(email);
    if (existing) {
      return { success: false, errors: { email: 'An account with this email address already exists.' } };
    }

    const newEmployee = {
      id: 'emp_' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      department: department.trim(),
      salary: parseFloat(salary),
      role: 'Employee',
      createdAt: new Date().toISOString()
    };

    const users = Storage.getUsers();
    users.push(newEmployee);
    Storage.saveUsers(users);

    const session = Storage.getSession();
    Storage.addActivity('Employee Added', `Employee ${newEmployee.name} (${newEmployee.department}) added.`, session?.name || 'Admin');

    return { success: true, employee: newEmployee };
  },

  /**
   * Update an existing employee
   */
  updateEmployee(id, data) {
    const { name, email, department, salary, password } = data;
    const errors = this.validate(data, true);

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const users = Storage.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return { success: false, errors: { general: 'Employee not found.' } };
    }

    // Check email uniqueness among other users
    const existing = Storage.getUserByEmail(email);
    if (existing && existing.id !== id) {
      return { success: false, errors: { email: 'This email is already in use by another user.' } };
    }

    users[index].name = name.trim();
    users[index].email = email.trim().toLowerCase();
    users[index].department = department.trim();
    users[index].salary = parseFloat(salary);
    if (password && password.trim().length >= 6) {
      users[index].password = password.trim();
    }

    Storage.saveUsers(users);

    // Also update cached employee names in attendance and leaves
    this.updateRelatedNames(id, users[index].name, users[index].department);

    const session = Storage.getSession();
    Storage.addActivity('Employee Updated', `Updated details for ${users[index].name}.`, session?.name || 'Admin');

    return { success: true, employee: users[index] };
  },

  /**
   * Delete an employee and cascade their records
   */
  deleteEmployee(id) {
    const users = Storage.getUsers();
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, error: 'Employee not found.' };

    // Remove user
    const updatedUsers = users.filter(u => u.id !== id);
    Storage.saveUsers(updatedUsers);

    // Cascade delete attendance records
    const attendance = Storage.getAttendance();
    const updatedAttendance = attendance.filter(a => a.employeeId !== id);
    Storage.saveAttendance(updatedAttendance);

    // Cascade delete leave requests
    const leaves = Storage.getLeaves();
    const updatedLeaves = leaves.filter(l => l.employeeId !== id);
    Storage.saveLeaves(updatedLeaves);

    const session = Storage.getSession();
    Storage.addActivity('Employee Deleted', `Deleted employee ${target.name} and removed their records.`, session?.name || 'Admin');

    return { success: true };
  },

  /**
   * Validate employee input fields
   */
  validate(data, isEdit = false) {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Full name is required (minimum 2 characters).';
    }

    if (!data.email || !emailRegex.test(data.email.trim())) {
      errors.email = 'A valid email address is required.';
    }

    if (!isEdit && (!data.password || data.password.length < 6)) {
      errors.password = 'Initial password must be at least 6 characters.';
    } else if (isEdit && data.password && data.password.length > 0 && data.password.length < 6) {
      errors.password = 'New password must be at least 6 characters.';
    }

    if (!data.department || data.department.trim() === '') {
      errors.department = 'Department selection is required.';
    }

    const sal = parseFloat(data.salary);
    if (isNaN(sal) || sal <= 0) {
      errors.salary = 'Monthly salary must be a positive number greater than zero.';
    }

    return errors;
  },

  /**
   * Keep employee name in sync across other tables
   */
  updateRelatedNames(employeeId, newName, newDept) {
    const attendance = Storage.getAttendance();
    let attChanged = false;
    attendance.forEach(a => {
      if (a.employeeId === employeeId) {
        a.employeeName = newName;
        attChanged = true;
      }
    });
    if (attChanged) Storage.saveAttendance(attendance);

    const leaves = Storage.getLeaves();
    let leaveChanged = false;
    leaves.forEach(l => {
      if (l.employeeId === employeeId) {
        l.employeeName = newName;
        l.department = newDept;
        leaveChanged = true;
      }
    });
    if (leaveChanged) Storage.saveLeaves(leaves);
  }
};
