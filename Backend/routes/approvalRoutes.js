import express from "express";
import {
  approveRequest,
  createApproval,
  denyRequest,
} from "../controller/approvalController.js";

const router = express.Router();

// router.post("/approvals", createApproval); // create approval + send mail
router.get("/approvals/:id/approve", approveRequest); // approve by head
router.get("/approvals/:id/deny", denyRequest); // deny by head

export default router;
