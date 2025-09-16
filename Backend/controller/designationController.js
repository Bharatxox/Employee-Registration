import db from "../db.js";

export const showDesignation = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Designation");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching designations:", err);
    res.status(500).json({ error: "Database error" });
  }
};
