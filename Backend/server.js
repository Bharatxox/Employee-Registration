import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import employeeRoutes from "./routes/employeeRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import designationRoutes from "./routes/designationRoutes.js";
import departmentHeadRoutes from "./routes/departmentHeadRoutes.js";
import optionsRoutes from "./routes/optionsRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api", employeeRoutes);
app.use("/api", departmentRoutes);
app.use("/api", designationRoutes);
app.use("/api", departmentHeadRoutes);
app.use("/api/options", optionsRoutes);
app.use("/api", approvalRoutes);
app.use("/api", companyRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
