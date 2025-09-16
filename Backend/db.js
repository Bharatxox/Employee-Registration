// db.js
import mysql from "mysql2/promise"; // 👈 use the promise wrapper

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Bharat@123",
  database: "form",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Optional test connection
(async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ Connected to MySQL");
    conn.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

export default db;
