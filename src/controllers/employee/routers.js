import { Router } from "express"
import { verifyAdmin, verifyUser } from "../../middleware/token.verify.js"
import * as EmployeeControllers from "./index.js"

const router = Router()

router.get("/", EmployeeControllers.allEmployee)
router.get("/shift", EmployeeControllers.shiftList)
router.get("/detail/:employeeId", EmployeeControllers.employeeDetail)
router.post("/register", verifyAdmin, EmployeeControllers.registerEmployee)
router.patch("/activate", verifyUser, EmployeeControllers.activateEmployee)

export default router