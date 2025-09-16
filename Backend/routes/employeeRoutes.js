import express from "express";
import {
  addEmployee,
  showEmployee,
  getEmployeeByCode,
  createMinimalEmployee,
  deleteMinimalEmployee,
} from "../controller/employeeController.js";

const router = express.Router();

router.post("/employee", addEmployee);
router.get("/employees", showEmployee);
router.get("/employees/:employee_code", getEmployeeByCode);
router.post("/employee/minimal", createMinimalEmployee);
router.delete("/employees/:empCode", deleteMinimalEmployee);

export default router;
