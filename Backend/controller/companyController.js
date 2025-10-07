import { pool, sql } from "../db.js"; // 👈 Changed import

// 🔹 Get all companies
export const showCompany = async (req, res) => {
  try {
    const result = await pool.request().query("SELECT * FROM Company");
    res.json(result.recordset); // 👈 Changed from rows to recordset
  } catch (err) {
    console.error("Error fetching company name:", err);
    res.status(500).json({ error: "Database error" });
  }
};
