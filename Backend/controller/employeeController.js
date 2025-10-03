import db from "../db.js";
import { createApproval } from "./approvalController.js";

// 🔹 Add or Update Employee
export const addEmployee = async (req, res) => {
  const {
    full_name,
    employee_code,
    unit_name,
    date_of_joining,
    mobile_no,
    application_access,
    responsibility_in_oracle,
    options_in_ebiz,
    department_id,
    designation_id,
    reporting_manager,
    reporting_manager_email,
    head_id,
    company_id,
    employee_email,
  } = req.body;

  const sql = `
  INSERT INTO employee (
    full_name, employee_code, unit_name, date_of_joining, mobile_no,
    application_access, responsibility_in_oracle, options_in_ebiz,
    reporting_manager, reporting_manager_email, company_id, employee_email
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    full_name = VALUES(full_name),
    unit_name = VALUES(unit_name),
    date_of_joining = VALUES(date_of_joining),
    mobile_no = VALUES(mobile_no),
    application_access = VALUES(application_access),
    responsibility_in_oracle = VALUES(responsibility_in_oracle),
    options_in_ebiz = VALUES(options_in_ebiz),
    reporting_manager = VALUES(reporting_manager),
    reporting_manager_email = VALUES(reporting_manager_email),
    company_id = VALUES(company_id),
    employee_email = VALUES(employee_email)
`;

  try {
    const [result] = await db.query(sql, [
      full_name,
      employee_code,
      unit_name,
      date_of_joining,
      mobile_no,
      application_access,
      responsibility_in_oracle,
      options_in_ebiz,
      reporting_manager,
      reporting_manager_email,
      company_id,
      employee_email,
    ]);

    // Rest of the code remains the same...
    // Get employee_id
    const [rows] = await db.query(
      `SELECT employee_id FROM employee WHERE employee_code = ?`,
      [employee_code]
    );
    const employeeId = rows[0].employee_id;

    // Department (store dept + head_id together)
    if (department_id && head_id) {
      await db.query(
        `
        INSERT INTO employeedepartment (employee_id, department_id, head_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          department_id = VALUES(department_id),
          head_id = VALUES(head_id)
        `,
        [employeeId, department_id, head_id]
      );
    }

    // Designation (upsert style)
    if (designation_id) {
      await db.query(
        `
        INSERT INTO employeedesignation (employee_id, designation_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE designation_id = VALUES(designation_id)
        `,
        [employeeId, designation_id]
      );
    }

    // Clone options from reference employee
    if (options_in_ebiz) {
      const [refOptions] = await db.query(
        `SELECT option_id, value FROM employee_option_values WHERE employee_code = ?`,
        [options_in_ebiz]
      );

      if (refOptions.length > 0) {
        await db.query(
          `DELETE FROM employee_option_values WHERE employee_code = ?`,
          [employee_code]
        );

        const insertValues = refOptions.map((opt) => [
          employee_code,
          opt.option_id,
          opt.value,
        ]);

        await db.query(
          `INSERT INTO employee_option_values (employee_code, option_id, value) VALUES ?`,
          [insertValues]
        );
      }
    }

    // 🔹 Create approval for this employee with exact head_id
    if (head_id) {
      try {
        await createApproval({ employee_code, head_id });
      } catch (approvalErr) {
        console.error("Approval creation failed:", approvalErr.message);
      }
    }

    if (company_id) {
      const [companyRows] = await db.query(
        "SELECT company_id FROM Company WHERE company_id = ?",
        [company_id]
      );

      if (companyRows.length === 0) {
        return res.status(400).json({ error: "Invalid company_id" });
      }
    }

    res.status(201).json({
      message:
        result.affectedRows > 1
          ? "Employee updated successfully"
          : "Employee added successfully",
      id: employeeId,
    });
  } catch (err) {
    console.error("SQL Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Show All Employees
// 🔹 Show All Employees
export const showEmployee = async (req, res) => {
  const sql = `
    SELECT 
      e.employee_id, 
      e.full_name, 
      e.employee_code, 
      e.unit_name, 
      DATE_FORMAT(e.date_of_joining, '%Y-%m-%d') AS date_of_joining,
      e.reporting_manager,
      e.reporting_manager_email,
      e.employee_email,
      e.mobile_no, 
      e.responsibility_in_oracle, 
      e.options_in_ebiz, 
      e.application_access,
      e.approval_department_head,
      d.department_name, 
      g.designation_name,
      dh.head_name AS divisional_head_name,
      dh.head_email AS divisional_head_email,
      c.company_name AS company_name
    FROM Employee e
    LEFT JOIN EmployeeDepartment ed ON e.employee_id = ed.employee_id
    LEFT JOIN Department d ON ed.department_id = d.department_id
    LEFT JOIN EmployeeDesignation eg ON e.employee_id = eg.employee_id
    LEFT JOIN Designation g ON eg.designation_id = g.designation_id
    LEFT JOIN DivisionalHead dh ON ed.head_id = dh.head_id   
    LEFT JOIN Company c ON e.company_id = c.company_id
  `;

  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// 🔹 Get Employee by Code
export const getEmployeeByCode = async (req, res) => {
  const { employee_code } = req.params;

  const sql = `
    SELECT employee_id, full_name, employee_code, unit_name, employee_email
    FROM Employee 
    WHERE employee_code = ?
    LIMIT 1
  `;

  try {
    const [results] = await db.query(sql, [employee_code]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(results[0]);
  } catch (err) {
    console.error("Error fetching employee:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// 🔹 Create Minimal Employee (just with code)
export const createMinimalEmployee = async (req, res) => {
  const { employee_code } = req.body;

  if (!employee_code) {
    return res.status(400).json({ error: "Employee code is required" });
  }

  const sql = `
    INSERT INTO Employee (employee_code, full_name, unit_name, date_of_joining)
    VALUES (?, '', NULL, NULL)
  `;

  try {
    const [result] = await db.query(sql, [employee_code]);

    res.status(201).json({
      message: "New employee created",
      employee_id: result.insertId,
      employee_code,
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Employee code already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Delete Employee + related options
export const deleteMinimalEmployee = async (req, res) => {
  const { empCode } = req.params;
  console.log(empCode);
  try {
    // First, try deleting the employee
    const [result] = await db.query(
      "DELETE FROM Employee WHERE employee_code = ?",
      [empCode]
    );

    if (result.affectedRows === 0) {
      // No employee found with this empCode
      return res.status(404).json({ error: `Employee ${empCode} not found` });
    }

    // Delete related options only if employee existed
    await db.query(
      "DELETE FROM employee_option_values WHERE employee_code = ?",
      [empCode]
    );

    res.json({ message: `Employee ${empCode} deleted successfully` });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete employee" });
  }
};
