import { Router } from "express"
import { verifyAdmin, verifyUser } from "../../middleware/token.verify.js"
import * as AuthControllers from "./index.js"

const router = Router()

router.post("/login", AuthControllers.login)
router.get("/keep-login", AuthControllers.keepLogin)
router.put("/forgot-password", AuthControllers.forgotPassword)
router.patch("/reset-password", AuthControllers.resetPassword)
router.post("/employee/register", verifyAdmin, AuthControllers.registerUser)
router.patch("/employee/activate", verifyUser, AuthControllers.activateUser)
router.get("/employee", verifyAdmin, AuthControllers.allEmployee)

export default router
