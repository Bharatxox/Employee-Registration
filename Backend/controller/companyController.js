import db from "../db.js";

// 🔹 Get all departments
export const showCompany = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Company");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching company name:", err);
    res.status(500).json({ error: "Database error" });
  }
};
