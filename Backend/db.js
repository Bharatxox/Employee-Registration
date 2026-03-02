// db.js
import sql from "mssql";

const dbConfig = {
  server: "10.240.48.108", // Update with your server name
  database: "form",
  user: "testadmin",
  password: "Ebizon2022", // Use the password that worked in SSMS
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

// Create connection pool
let pool;

(async () => {
  try {
    pool = await sql.connect(dbConfig);
    console.log("✅ Connected to SQL Server");
  } catch (err) {
    console.error("❌ SQL Server connection failed:", err.message);
  }
})();

export { pool, sql };
