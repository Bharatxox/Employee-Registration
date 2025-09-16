import express from "express";
import { showDesignation } from "../controller/designationController.js";

const router = express.Router();

router.get("/designations", showDesignation);

export default router;
