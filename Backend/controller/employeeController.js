import { pool, sql } from "../db.js";
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

  try {
    // SQL Server doesn't have ON DUPLICATE KEY UPDATE, so we use MERGE
    const mergeSql = `
      MERGE Employee AS target
      USING (SELECT @employee_code AS employee_code) AS source
      ON target.employee_code = source.employee_code
      WHEN MATCHED THEN
        UPDATE SET 
          full_name = @full_name,
          unit_name = @unit_name,
          date_of_joining = @date_of_joining,
          mobile_no = @mobile_no,
          application_access = @application_access,
          responsibility_in_oracle = @responsibility_in_oracle,
          options_in_ebiz = @options_in_ebiz,
          reporting_manager = @reporting_manager,
          reporting_manager_email = @reporting_manager_email,
          company_id = @company_id,
          employee_email = @employee_email
      WHEN NOT MATCHED THEN
        INSERT (
          full_name, employee_code, unit_name, date_of_joining, mobile_no,
          application_access, responsibility_in_oracle, options_in_ebiz,
          reporting_manager, reporting_manager_email, company_id, employee_email
        ) VALUES (
          @full_name, @employee_code, @unit_name, @date_of_joining, @mobile_no,
          @application_access, @responsibility_in_oracle, @options_in_ebiz,
          @reporting_manager, @reporting_manager_email, @company_id, @employee_email
        );
    `;

    const result = await pool
      .request()
      .input("full_name", sql.VarChar, full_name)
      .input("employee_code", sql.VarChar, employee_code)
      .input("unit_name", sql.VarChar, unit_name)
      .input("date_of_joining", sql.Date, date_of_joining)
      .input("mobile_no", sql.BigInt, mobile_no)
      .input("application_access", sql.VarChar, application_access)
      .input("responsibility_in_oracle", sql.VarChar, responsibility_in_oracle)
      .input("options_in_ebiz", sql.VarChar, options_in_ebiz)
      .input("reporting_manager", sql.VarChar, reporting_manager)
      .input("reporting_manager_email", sql.VarChar, reporting_manager_email)
      .input("company_id", sql.Int, company_id)
      .input("employee_email", sql.VarChar, employee_email)
      .query(mergeSql);

    // Get employee_id
    const employeeResult = await pool
      .request()
      .input("employee_code", sql.VarChar, employee_code)
      .query(
        "SELECT employee_id FROM employee WHERE employee_code = @employee_code"
      );

    const employeeId = employeeResult.recordset[0]?.employee_id;

    // Department (store dept + head_id together)
    if (department_id && head_id) {
      const deptMergeSql = `
        MERGE EmployeeDepartment AS target
        USING (SELECT @employeeId AS employee_id, @department_id AS department_id) AS source
        ON target.employee_id = source.employee_id
        WHEN MATCHED THEN
          UPDATE SET 
            department_id = @department_id,
            head_id = @head_id
        WHEN NOT MATCHED THEN
          INSERT (employee_id, department_id, head_id)
          VALUES (@employeeId, @department_id, @head_id);
      `;

      await pool
        .request()
        .input("employeeId", sql.Int, employeeId)
        .input("department_id", sql.Int, department_id)
        .input("head_id", sql.Int, head_id)
        .query(deptMergeSql);
    }

    // Designation (upsert style)
    if (designation_id) {
      const designationMergeSql = `
        MERGE EmployeeDesignation AS target
        USING (SELECT @employeeId AS employee_id, @designation_id AS designation_id) AS source
        ON target.employee_id = source.employee_id
        WHEN MATCHED THEN
          UPDATE SET designation_id = @designation_id
        WHEN NOT MATCHED THEN
          INSERT (employee_id, designation_id)
          VALUES (@employeeId, @designation_id);
      `;

      await pool
        .request()
        .input("employeeId", sql.Int, employeeId)
        .input("designation_id", sql.Int, designation_id)
        .query(designationMergeSql);
    }

    // Clone options from reference employee
    if (options_in_ebiz) {
      const refOptionsResult = await pool
        .request()
        .input("options_in_ebiz", sql.VarChar, options_in_ebiz)
        .query(
          "SELECT option_id, value FROM employee_option_values WHERE employee_code = @options_in_ebiz"
        );

      if (refOptionsResult.recordset.length > 0) {
        // Delete existing options
        await pool
          .request()
          .input("employee_code", sql.VarChar, employee_code)
          .query(
            "DELETE FROM employee_option_values WHERE employee_code = @employee_code"
          );

        // Insert new options one by one
        for (const opt of refOptionsResult.recordset) {
          await pool
            .request()
            .input("employee_code", sql.VarChar, employee_code)
            .input("option_id", sql.VarChar, opt.option_id)
            .input("value", sql.VarChar, opt.value).query(`
              INSERT INTO employee_option_values (employee_code, option_id, value) 
              VALUES (@employee_code, @option_id, @value)
            `);
        }
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
      const companyResult = await pool
        .request()
        .input("company_id", sql.Int, company_id)
        .query("SELECT company_id FROM Company WHERE company_id = @company_id");

      if (companyResult.recordset.length === 0) {
        return res.status(400).json({ error: "Invalid company_id" });
      }
    }

    const isUpdate = result.rowsAffected[0] > 1;
    res.status(201).json({
      message: isUpdate
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
export const showEmployee = async (req, res) => {
  const sql = `
    SELECT 
      e.employee_id, 
      e.full_name, 
      e.employee_code, 
      e.unit_name, 
      CONVERT(VARCHAR(10), e.date_of_joining, 120) AS date_of_joining,
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
    const result = await pool.request().query(sql);
    res.json(result.recordset);
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
    WHERE employee_code = @employee_code
  `;

  try {
    const result = await pool
      .request()
      .input("employee_code", sql.VarChar, employee_code)
      .query(sql);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(result.recordset[0]);
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

  try {
    const result = await pool
      .request()
      .input("employee_code", sql.VarChar, employee_code).query(`
        INSERT INTO Employee (employee_code, full_name, unit_name, date_of_joining)
        OUTPUT INSERTED.employee_id
        VALUES (@employee_code, '', NULL, NULL)
      `);

    res.status(201).json({
      message: "New employee created",
      employee_id: result.recordset[0].employee_id,
      employee_code,
    });
  } catch (err) {
    if (err.number === 2627) {
      // SQL Server duplicate key error
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
    // Delete related options first (due to foreign key constraints)
    await pool
      .request()
      .input("empCode", sql.VarChar, empCode)
      .query(
        "DELETE FROM employee_option_values WHERE employee_code = @empCode"
      );

    // Then delete the employee
    const result = await pool
      .request()
      .input("empCode", sql.VarChar, empCode)
      .query("DELETE FROM Employee WHERE employee_code = @empCode");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: `Employee ${empCode} not found` });
    }

    res.json({ message: `Employee ${empCode} deleted successfully` });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete employee" });
  }
};
