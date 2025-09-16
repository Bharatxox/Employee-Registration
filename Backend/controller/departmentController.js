import db from "../db.js";

// 🔹 Get all departments
export const showDepartment = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Department");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ error: "Database error" });
  }
};
