import db from "../db.js";

// Get all units for dropdown
export const getUnits = async (req, res) => {
  try {
    const [units] = await db.query(`
      SELECT unit_id, unit_code 
      FROM Units 
      ORDER BY unit_code
    `);
    res.json(units);
  } catch (err) {
    console.error("Error fetching units:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// Add new unit
export const addUnit = async (req, res) => {
  const { unit_code } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO Units (unit_code) VALUES (?)",
      [unit_code]
    );

    res.status(201).json({
      message: "Unit added successfully",
      unit_id: result.insertId,
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Unit code already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};
