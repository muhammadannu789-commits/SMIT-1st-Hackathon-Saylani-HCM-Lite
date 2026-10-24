/**
 * HCM Lite - Monthly Payslip Calculator
 * Calculates precise payroll breakdowns according to the required formula:
 * - Per-day salary = Monthly salary ÷ working days in the month
 * - Deduction = Per-day salary × (absent days + 0.5 × half days)
 * - Net salary = Monthly salary − deduction
 */

const PayslipCalculator = {
  /**
   * Calculate payslip for an employee for a specific YYYY-MM
   * @param {string} employeeId 
   * @param {string} yearMonth "2026-10"
   */
  calculate(employeeId, yearMonth) {
    const user = Storage.getUserById(employeeId);
    if (!user) return { success: false, error: 'Employee not found.' };

    const company = Storage.getCompany() || {
      name: 'Saylani HCM Lite',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    };

    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-12

    const workingDaysList = company.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const totalWorkingDaysInMonth = Helper.getWorkingDaysInMonth(year, month, workingDaysList);

    if (totalWorkingDaysInMonth === 0) {
      return { success: false, error: 'No working days configured for this month.' };
    }

    const attendanceRecords = Storage.getAttendance();
    const leaves = Storage.getLeaves();

    const todayStr = Helper.getTodayDateString();
    const today = new Date(todayStr + 'T00:00:00');

    const totalDaysInMonth = new Date(year, month, 0).getDate();

    let presentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let leaveDays = 0;
    let absentDays = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayDate = new Date(year, month - 1, day);
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Check if it's a working day
      if (!Helper.isWorkingDay(dayDate, workingDaysList)) {
        continue; // Weekend or off-day; no attendance or deduction applies
      }

      // Check if employee had approved leave on this date
      const onApprovedLeave = leaves.some(l => {
        return l.employeeId === employeeId && l.status === 'Approved' && l.startDate <= dateStr && l.endDate >= dateStr;
      });

      if (onApprovedLeave) {
        leaveDays++;
        continue;
      }

      // Check attendance record
      const att = attendanceRecords.find(r => r.employeeId === employeeId && r.date === dateStr);

      if (att && att.checkInTime) {
        if (att.status === 'Half Day' || (att.durationHours > 0 && att.durationHours < 5.0)) {
          halfDays++;
        } else {
          presentDays++;
          if (att.status === 'Late') {
            lateDays++;
          }
        }
      } else {
        // No check-in recorded on this working day
        // If the date is past or today, count as Absent
        if (dayDate <= today) {
          absentDays++;
        }
      }
    }

    const monthlySalary = parseFloat(user.salary) || 0;
    const perDaySalary = monthlySalary / totalWorkingDaysInMonth;
    const deduction = perDaySalary * (absentDays + (0.5 * halfDays));
    const netSalary = Math.max(0, monthlySalary - deduction);

    return {
      success: true,
      employee: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department || 'N/A',
        monthlySalary: monthlySalary
      },
      company: company,
      period: {
        yearMonth: yearMonth,
        year: year,
        month: month,
        monthName: new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' })
      },
      metrics: {
        totalWorkingDays: totalWorkingDaysInMonth,
        presentDays: presentDays,
        lateDays: lateDays,
        halfDays: halfDays,
        leaveDays: leaveDays,
        absentDays: absentDays
      },
      calculations: {
        monthlySalary: monthlySalary,
        perDaySalary: Math.round(perDaySalary * 100) / 100,
        absentDeduction: Math.round(perDaySalary * absentDays * 100) / 100,
        halfDayDeduction: Math.round(perDaySalary * 0.5 * halfDays * 100) / 100,
        totalDeduction: Math.round(deduction * 100) / 100,
        netSalary: Math.round(netSalary * 100) / 100
      }
    };
  },

  /**
   * Helper to convert number to words for cheque/payslip representation
   */
  numberToWords(amount) {
    const num = Math.floor(amount);
    if (num === 0) return 'Zero Rupees Only';

    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function inWords(n) {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return inWords(Math.floor(n / 100)) + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
    }

    return inWords(num) + ' Rupees Only';
  }
};
