import { Router } from "express";
import { verifyUser } from "../../middleware/token.verify.js";
import * as PayrollControllers from "./index.js"

const router = Router()

router.get("/", PayrollControllers.payrollEmployee)
router.get("/deduction", PayrollControllers.deductionPayrollEmployee)

export default router