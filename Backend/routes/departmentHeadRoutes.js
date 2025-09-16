import express from "express";
import {
  getDepartmentHead,
  showDepartmentHead,
} from "../controller/departmentHeadController.js";

const router = express.Router();

router.get("/department-heads", showDepartmentHead);
router.get("/department-heads/:id", getDepartmentHead);

export default router;
