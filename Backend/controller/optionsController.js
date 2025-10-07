import { pool, sql } from "../db.js";

// 🔹 Get all root options for a specific employee
export const mainOptions = async (req, res) => {
  const { employeeId } = req.params;

  const query = `
    SELECT 
      o.option_id, 
      o.option_name, 
      o.parent_id, 
      COALESCE(eov.value, 'No') AS value,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM options c WHERE c.parent_id = o.option_id
        ) THEN 0
        ELSE 1
      END AS is_leaf
    FROM options o
    LEFT JOIN employee_option_values eov 
      ON o.option_id = eov.option_id 
      AND eov.employee_code = @employeeId
    WHERE o.parent_id IS NULL
    ORDER BY o.option_id;
  `;

  try {
    const result = await pool
      .request()
      .input("employeeId", sql.VarChar, employeeId)
      .query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error in mainOptions:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Get children of a parent option for an employee
export const subOptions = async (req, res) => {
  const { parentId, employeeId } = req.params;

  const query = `
    SELECT 
      o.option_id, 
      o.option_name, 
      o.parent_id, 
      COALESCE(eov.value, 'No') AS value,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM options c WHERE c.parent_id = o.option_id
        ) THEN 0
        ELSE 1
      END AS is_leaf
    FROM options o
    LEFT JOIN employee_option_values eov 
      ON o.option_id = eov.option_id 
      AND eov.employee_code = @employeeId
    WHERE o.parent_id = @parentId
    ORDER BY o.option_id;
  `;

  try {
    const result = await pool
      .request()
      .input("employeeId", sql.VarChar, employeeId)
      .input("parentId", sql.VarChar, parentId)
      .query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error in subOptions:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Update or insert employee option value
export const updateOptionValue = async (req, res) => {
  const { optionId, employeeId } = req.params;
  const { value } = req.body; // "Yes" or "No"

  const query = `
    MERGE employee_option_values AS target
    USING (SELECT @employeeId AS employee_code, @optionId AS option_id) AS source
    ON target.employee_code = source.employee_code AND target.option_id = source.option_id
    WHEN MATCHED THEN
      UPDATE SET value = @value
    WHEN NOT MATCHED THEN
      INSERT (employee_code, option_id, value)
      VALUES (@employeeId, @optionId, @value);
  `;

  try {
    await pool
      .request()
      .input("employeeId", sql.VarChar, employeeId)
      .input("optionId", sql.VarChar, optionId)
      .input("value", sql.VarChar, value)
      .query(query);

    res.json({ success: true, employeeId, optionId, value });
  } catch (error) {
    console.error("Error in updateOptionValue:", error.message);
    res.status(500).json({ error: error.message });
  }
};
