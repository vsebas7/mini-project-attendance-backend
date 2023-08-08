import { Router } from "express"
import { verifyUser } from "../../middleware/token.verify.js"
import * as AuthControllers from "./index.js"

const router = Router()

router.post("/login", AuthControllers.login)
router.get("/keep-login", verifyUser, AuthControllers.keepLogin)
router.put("/forgot-password", AuthControllers.forgotPassword)
router.patch("/reset-password", AuthControllers.resetPassword)

export default router
