import express from "express";
import {
  mainOptions,
  subOptions,
  updateOptionValue,
} from "../controller/optionsController.js";

const router = express.Router();

// Get main options for an employee
router.get("/:employeeId/main", mainOptions);

// Get sub-options for a parent for an employee
router.get("/:employeeId/:parentId/children", subOptions);

// Update an employee’s option value
router.put("/:employeeId/options/:optionId", updateOptionValue);

export default router;
