import express from "express";
import { showDepartment } from "../controller/departmentController.js";

const router = express.Router();

router.get("/departments", showDepartment);

export default router;
