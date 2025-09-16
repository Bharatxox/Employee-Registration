import express from "express";
import { showCompany } from "../controller/companyController.js";

const router = express.Router();

router.get("/companies", showCompany);

export default router;
