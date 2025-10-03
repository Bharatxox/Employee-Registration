import express from "express";
import { getUnits, addUnit } from "../controller/unitNameController.js";

const router = express.Router();

router.get("/units", getUnits);
router.post("/units", addUnit);

export default router;
