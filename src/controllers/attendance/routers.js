import { Router } from "express";
import { verifyUser } from "../../middleware/token.verify.js";
import * as AttendanceControllers from "./index.js"

const router = Router()

router.post("/clock-in", verifyUser, AttendanceControllers.clockIn)
router.post("/clock-out", verifyUser, AttendanceControllers.clockOut)
router.get("/history", verifyUser, AttendanceControllers.historyAttendance)
router.get("/payroll",AttendanceControllers.payrollEmployee)
router.get("/payroll/deduction",AttendanceControllers.deductionPayroolEmployee)

export default router