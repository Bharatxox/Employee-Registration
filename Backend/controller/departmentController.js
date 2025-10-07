import { pool, sql } from "../db.js";

// 🔹 Get all departments
export const showDepartment = async (req, res) => {
  try {
    const result = await pool.request().query("SELECT * FROM Department");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Database error" });
  }
};
