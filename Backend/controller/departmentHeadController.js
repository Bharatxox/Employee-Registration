import db from "../db.js";

// 🔹 Get all divisional heads
export const showDepartmentHead = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM DivisionalHead");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching divisional heads:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// 🔹 Get department head by department ID
export const getDepartmentHead = async (req, res) => {
  try {
    const departmentId = req.params.id;
    const [rows] = await db.query(
      "SELECT head_id, head_name, department_id FROM DivisionalHead WHERE department_id = ?",
      [departmentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Department head not found" });
    }
    // console.log("-----------------------------------------------", rows);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching department head:", err);
    res.status(500).json({ error: "Database error" });
  }
};
