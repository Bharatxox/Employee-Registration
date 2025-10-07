import { pool, sql } from "../db.js";

// Get all units for dropdown
export const getUnits = async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT unit_id, unit_code 
      FROM Units 
      ORDER BY unit_code
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching units:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Add new unit
export const addUnit = async (req, res) => {
  const { unit_code } = req.body;

  try {
    const result = await pool
      .request()
      .input("unit_code", sql.VarChar, unit_code).query(`
        INSERT INTO Units (unit_code) 
        OUTPUT INSERTED.unit_id
        VALUES (@unit_code)
      `);

    res.status(201).json({
      message: "Unit added successfully",
      unit_id: result.recordset[0].unit_id,
    });
  } catch (err) {
    if (err.number === 2627) {
      // SQL Server duplicate key error
      res.status(400).json({ error: "Unit code already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};
