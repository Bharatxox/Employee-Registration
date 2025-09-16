import db from "../db.js";
import { sendmail } from "../config/send-mail.js"; // your resend helper

// 📩 Mail for Department Heah  (FYI with approve and denied buttons)
const sendApprovalMail = async (employee_code, head, approvalId) => {
  // Get employee details
  const [employeeData] = await db.query(
    `SELECT e.employee_id, e.full_name, e.employee_code, e.unit_name, 
          DATE_FORMAT(e.date_of_joining, '%Y-%m-%d') AS date_of_joining,
          e.created_at, e.mobile_no, e.responsibility_in_oracle, 
          e.options_in_ebiz,
          c.company_name
   FROM Employee e
   LEFT JOIN Company c ON e.company_id = c.company_id
   WHERE e.employee_code = ?`,
    [employee_code]
  );

  if (!employeeData.length) throw new Error("Employee not found");
  const emp = employeeData[0];

  // Get selected "Yes" options
  const [options] = await db.query(
    `SELECT o.option_name
     FROM employee_option_values ev
     JOIN Options o ON ev.option_id = o.option_id
     WHERE ev.employee_code = ? AND ev.value = 'Yes'`,
    [employee_code]
  );

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
};

// 📩 Mail for Reporting Manager (FYI only, no buttons)
const sendReportingManagerMail = async (
  employee_code,
  reportingManagerEmail
) => {
  const [employeeData] = await db.query(
    `SELECT e.employee_id, e.full_name, e.employee_code, e.unit_name, 
          DATE_FORMAT(e.date_of_joining, '%Y-%m-%d') AS date_of_joining,
          e.created_at, e.mobile_no, e.responsibility_in_oracle, 
          e.options_in_ebiz,
          c.company_name
   FROM Employee e
   LEFT JOIN Company c ON e.company_id = c.company_id
   WHERE e.employee_code = ?`,
    [employee_code]
  );

  if (!employeeData.length) throw new Error("Employee not found");
  const emp = employeeData[0];

  const [options] = await db.query(
    `SELECT o.option_name
     FROM employee_option_values ev
     JOIN Options o ON ev.option_id = o.option_id
     WHERE ev.employee_code = ? AND ev.value = 'Yes'`,
    [employee_code]
  );

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

  console.log(reportingManagerEmail);

  await sendmail({
    to: reportingManagerEmail,
    subject: `FYI: Employee ${emp.full_name} Added`,
    html: htmlContent,
  });
};

// Create approval entry + send mail
export const createApproval = async ({ employee_code, head_id }) => {
  try {
    const [employeeRows] = await db.query(
      "SELECT * FROM Employee WHERE employee_code = ?",
      [employee_code]
    );
    const employee = employeeRows[0];

    const [headRows] = await db.query(
      "SELECT * FROM DivisionalHead WHERE head_id = ?",
      [head_id]
    );
    const head = headRows[0];

    if (!employee || !head) {
      throw new Error("Employee or Head not found");
    }

    // prevent duplicate pending approvals
    const [existing] = await db.query(
      "SELECT * FROM EmployeeApprovals WHERE employee_code = ? AND head_id = ? AND status = 'Pending'",
      [employee_code, head_id]
    );

    if (existing.length > 0) {
      throw new Error("Approval request already pending");
    }

    const [result] = await db.query(
      "INSERT INTO EmployeeApprovals (employee_code, head_id, status, created_at) VALUES (?, ?, 'Pending', NOW())",
      [employee_code, head_id]
    );

    const approvalId = result.insertId;

    await sendApprovalMail(employee_code, head, approvalId);

    if (employee.reporting_manager_email) {
      await sendReportingManagerMail(
        employee_code,
        employee.reporting_manager_email
      );
    }

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
    await db.query(
      "UPDATE EmployeeApprovals SET status = 'Approved', updated_at = NOW() WHERE approval_id = ?",
      [id]
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
    await db.query(
      "UPDATE EmployeeApprovals SET status = 'Denied', updated_at = NOW() WHERE approval_id = ?",
      [id]
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
