import { pool, sql } from "../db.js";

export const showDesignation = async (req, res) => {
  try {
    const result = await pool.request().query("SELECT * FROM Designation");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching designations:", err);
    res.status(500).json({ error: "Database error" });
  }
};
