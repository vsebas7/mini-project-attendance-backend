import { Router } from "express";
import { verifyEmployee, verifyUser } from "../../middleware/token.verify.js";
import * as AttendanceControllers from "./index.js"

const router = Router()

router.post("/clock-in", verifyEmployee, AttendanceControllers.clockIn)
router.post("/clock-out", verifyEmployee, AttendanceControllers.clockOut)
router.get("/history", verifyUser, AttendanceControllers.historyAttendance)

export default router