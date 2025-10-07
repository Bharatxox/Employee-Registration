import { pool, sql } from "../db.js"; // 👈 Changed import
import { sendmail } from "../config/send-mail.js";

// 📩 Mail for Department Head (FYI with approve and denied buttons)
const sendApprovalMail = async (employee_code, head, approvalId) => {
  try {
    // Get employee details - CONVERTED to SQL Server
    const employeeResult = await pool
      .request()
      .input("employee_code", sql.VarChar, employee_code).query(`
        SELECT e.employee_id, e.full_name, e.employee_code, e.unit_name, 
              CONVERT(VARCHAR(10), e.date_of_joining, 120) AS date_of_joining,
              e.created_at, e.mobile_no, e.responsibility_in_oracle, 
              e.options_in_ebiz, e.employee_email,
              c.company_name
        FROM Employee e
        LEFT JOIN Company c ON e.company_id = c.company_id
        WHERE e.employee_code = @employee_code
      `);

    if (employeeResult.recordset.length === 0)
      throw new Error("Employee not found");
    const emp = employeeResult.recordset[0];

    // Get selected "Yes" options - CONVERTED
    const optionsResult = await pool
      .request()
      .input("employee_code", sql.VarChar, employee_code).query(`
        SELECT o.option_name
        FROM employee_option_values ev
        JOIN options o ON ev.option_id = o.option_id
        WHERE ev.employee_code = @employee_code AND ev.value = 'Yes'
      `);

    const options = optionsResult.recordset;

    const approveUrl = `http://localhost:5000/api/approvals/${approvalId}/approve`;
    const denyUrl = `http://localhost:5000/api/approvals/${approvalId}/deny`;

    const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 14px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
      
      <!-- Header -->
      <h2 style="text-align: center; color: #111827; margin-bottom: 20px; font-size: 22px;">Approval Request</h2>
      
      <!-- Card -->
      <div style="background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <p style="margin: 8px 0;"><b style="color:#374151;">Name:</b> ${
          emp.full_name
        }</p>
        <p style="margin: 8px 0;"><b style="color:#374151;">Employee Code:</b> ${
          emp.employee_code
        }</p>
        <p style="margin: 8px 0;"><b style="color:#374151;">Email:</b> ${
          emp.employee_email || "-"
        }</p>
        <p style="margin: 8px 0;"><b style="color:#374151;">Unit:</b> ${
          emp.unit_name || "-"
        }</p>
        <p style="margin: 8px 0;"><b style="color:#374151;">Date of Joining:</b> ${
          emp.date_of_joining || "-"
        }</p>
        <p style="margin: 8px 0;"><b style="color:#374151;">Mobile:</b> ${
          emp.mobile_no || "-"
        }</p>
        <p style="margin: 8px 0;"><b style="color:#374151;">Company Name:</b> ${
          emp.company_name || "-"
        }</p>

        ${
          emp.responsibility_in_oracle && emp.responsibility_in_oracle.trim()
            ? `<p style="margin: 12px 0;"><b style="color:#374151;">Responsibilities:</b> ${emp.responsibility_in_oracle}</p>`
            : `
              <div style="margin-top: 14px;">
                <p style="margin: 6px 0;"><b style="color:#374151;">Options Selected:</b></p>
                <ul style="padding-left: 20px; margin: 6px 0; color: #4b5563;">
                  ${
                    options.length > 0
                      ? options.map((o) => `<li>${o.option_name}</li>`).join("")
                      : "<li>None</li>"
                  }
                </ul>
              </div>
            `
        }
      </div>
      
      <!-- Divider -->
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;"/>
      
      <!-- Footer -->
      <p style="text-align: center; font-size: 16px; color: #6b7280; margin-bottom: 20px;">Please take action:</p>
      
      <!-- Buttons -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 10px auto;">
        <tr>
          <td align="center" style="padding: 0 12px;">
            <a href="${approveUrl}" 
               style="padding: 12px 28px; background: #22c55e; color: #fff; 
                      text-decoration: none; font-weight: 600; border-radius: 10px; 
                      display: inline-block; font-size: 15px; box-shadow: 0 2px 6px rgba(34,197,94,0.4);">
              ✅ Approve
            </a>
          </td>
          <td align="center" style="padding: 0 12px;">
            <a href="${denyUrl}" 
               style="padding: 12px 28px; background: #ef4444; color: #fff; 
                      text-decoration: none; font-weight: 600; border-radius: 10px; 
                      display: inline-block; font-size: 15px; box-shadow: 0 2px 6px rgba(239,68,68,0.4);">
              ❌ Deny
            </a>
          </td>
        </tr>
      </table>
    </div>
    `;

    console.log("📧 Sending Head mail to:", head.head_email);

    await sendmail({
      to: head.head_email,
      subject: `Approval Request for ${emp.full_name}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error("Error in sendApprovalMail:", error);
    throw error;
  }
};

// 📩 Mail for Reporting Manager (FYI only, no buttons)
const sendReportingManagerMail = async (
  employee_code,
  reportingManagerEmail
) => {
  try {
    // CONVERTED to SQL Server
    const employeeResult = await pool
      .request()
      .input("employee_code", sql.VarChar, employee_code).query(`
        SELECT e.employee_id, e.full_name, e.employee_code, e.unit_name, 
              CONVERT(VARCHAR(10), e.date_of_joining, 120) AS date_of_joining,
              e.created_at, e.mobile_no, e.responsibility_in_oracle, 
              e.options_in_ebiz, e.employee_email,
              c.company_name
        FROM Employee e
        LEFT JOIN Company c ON e.company_id = c.company_id
        WHERE e.employee_code = @employee_code
      `);

    if (employeeResult.recordset.length === 0)
      throw new Error("Employee not found");
    const emp = employeeResult.recordset[0];

    // CONVERTED to SQL Server
    const optionsResult = await pool
      .request()
      .input("employee_code", sql.VarChar, employee_code).query(`
        SELECT o.option_name
        FROM employee_option_values ev
        JOIN options o ON ev.option_id = o.option_id
        WHERE ev.employee_code = @employee_code AND ev.value = 'Yes'
      `);

    const options = optionsResult.recordset;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 14px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
      
      <!-- Header -->
      <h2 style="text-align: center; color: #111827; margin-bottom: 20px; font-size: 22px;">Approval Request</h2>
      
      <!-- Card -->
      <div style="background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <p style="margin: 8px 0;"><b style="color:#374151;">Name:</b> ${
          emp.full_name
        }</p>
        <p style="margin: 8px 0;"><b style="color:#374151;">Employee Code:</b> ${
          emp.employee_code
        }</p>
        <p style="margin: 8px 0;"><b style="color:#374151;">Email:</b> ${
          emp.employee_email || "-"
        }</p>
        <p style="margin: 8px 0;"><b style="color:#374151;">Unit:</b> ${
          emp.unit_name || "-"
        }</p>
        <p style="margin: 8px 0;"><b style="color:#374151;">Date of Joining:</b> ${
          emp.date_of_joining || "-"
        }</p>
        <p style="margin: 8px 0;"><b style="color:#374151;">Mobile:</b> ${
          emp.mobile_no || "-"
        }</p>
        <p style="margin: 8px 0;"><b style="color:#374151;">Company Name:</b> ${
          emp.company_name || "-"
        }</p>

        ${
          emp.responsibility_in_oracle && emp.responsibility_in_oracle.trim()
            ? `<p style="margin: 12px 0;"><b style="color:#374151;">Responsibilities:</b> ${emp.responsibility_in_oracle}</p>`
            : `
              <div style="margin-top: 14px;">
                <p style="margin: 6px 0;"><b style="color:#374151;">Options Selected:</b></p>
                <ul style="padding-left: 20px; margin: 6px 0; color: #4b5563;">
                  ${
                    options.length > 0
                      ? options.map((o) => `<li>${o.option_name}</li>`).join("")
                      : "<li>None</li>"
                  }
                </ul>
              </div>
            `
        }
      </div>
      </div>
    `;

    console.log("📧 Sending Reporting Manager mail to:", reportingManagerEmail);

    await sendmail({
      to: reportingManagerEmail,
      subject: `FYI: Employee ${emp.full_name} Added`,
      html: htmlContent,
    });
  } catch (error) {
    console.error("Error in sendReportingManagerMail:", error);
    throw error;
  }
};

// Create approval entry + send mail
export const createApproval = async ({ employee_code, head_id }) => {
  try {
    // CONVERTED to SQL Server
    const employeeResult = await pool
      .request()
      .input("employee_code", sql.VarChar, employee_code)
      .query("SELECT * FROM Employee WHERE employee_code = @employee_code");

    const employee = employeeResult.recordset[0];

    const headResult = await pool
      .request()
      .input("head_id", sql.Int, head_id)
      .query("SELECT * FROM DivisionalHead WHERE head_id = @head_id");

    const head = headResult.recordset[0];

    if (!employee || !head) {
      throw new Error("Employee or Head not found");
    }

    // prevent duplicate pending approvals - CONVERTED
    const existingResult = await pool
      .request()
      .input("employee_code", sql.VarChar, employee_code)
      .input("head_id", sql.Int, head_id).query(`
        SELECT * FROM EmployeeApprovals 
        WHERE employee_code = @employee_code AND head_id = @head_id AND status = 'Pending'
      `);

    if (existingResult.recordset.length > 0) {
      throw new Error("Approval request already pending");
    }

    // CONVERTED - SQL Server uses OUTPUT for inserted ID
    const insertResult = await pool
      .request()
      .input("employee_code", sql.VarChar, employee_code)
      .input("head_id", sql.Int, head_id).query(`
        INSERT INTO EmployeeApprovals (employee_code, head_id, status, created_at) 
        OUTPUT INSERTED.approval_id
        VALUES (@employee_code, @head_id, 'Pending', GETDATE())
      `);

    const approvalId = insertResult.recordset[0].approval_id;

    await sendApprovalMail(employee_code, head, approvalId);

    if (employee.reporting_manager_email) {
      await sendReportingManagerMail(
        employee_code,
        employee.reporting_manager_email
      );
    }

    console.log(
      `✅ Approval created for ${employee_code} with head ${head_id}`
    );

    return { message: "Approval request created and mail sent", approvalId };
  } catch (err) {
    console.error("Approval create error:", err);
    throw err;
  }
};

// Approve
export const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // CONVERTED to SQL Server
    const approvalResult = await pool.request().input("id", sql.Int, id).query(`
        SELECT ea.*, dh.head_name 
        FROM EmployeeApprovals ea 
        JOIN DivisionalHead dh ON ea.head_id = dh.head_id 
        WHERE ea.approval_id = @id
      `);

    if (approvalResult.recordset.length === 0) {
      return res.status(404).json({ error: "Approval request not found" });
    }

    const approval = approvalResult.recordset[0];

    // Update the approval status - CONVERTED
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(
        "UPDATE EmployeeApprovals SET status = 'Approved', updated_at = GETDATE() WHERE approval_id = @id"
      );

    // Update the employee record - CONVERTED
    await pool
      .request()
      .input("head_name", sql.VarChar, approval.head_name)
      .input("employee_code", sql.VarChar, approval.employee_code)
      .query(
        "UPDATE Employee SET approval_department_head = @head_name WHERE employee_code = @employee_code"
      );

    console.log(
      `✅ Employee ${approval.employee_code} approved by ${approval.head_name}`
    );

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Approval Success</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .message-box {
            background: #fff;
            padding: 30px 40px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            text-align: center;
          }
          .success {
            color: green;
            font-size: 1.2rem;
          }
        </style>
      </head>
      <body>
        <div class="message-box">
          <div class="success">✅ Your approval has been recorded. Thank you!</div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Approval error:", err);
    res.status(500).json({ error: "Failed to approve request" });
  }
};

// Deny
export const denyRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // CONVERTED to SQL Server
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(
        "UPDATE EmployeeApprovals SET status = 'Denied', updated_at = GETDATE() WHERE approval_id = @id"
      );

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Request Denied</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .message-box {
            background: #fff;
            padding: 30px 40px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            text-align: center;
          }
          .denied {
            color: red;
            font-size: 1.2rem;
          }
        </style>
      </head>
      <body>
        <div class="message-box">
          <div class="denied">❌ The request has been denied. Thank you!</div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Deny error:", err);
    res.status(500).json({ error: "Failed to deny request" });
  }
};
