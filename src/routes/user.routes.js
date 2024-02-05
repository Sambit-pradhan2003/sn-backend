import { Router } from "express";
import { registeruser,loginuser,logoutuser,refreshacesstoken} from "../controllers/user.controller.js"
import {upload}from "../middlewares/multer.middleware.js"
import { verifyjwt }from "../middlewares/auth.middleware.js"

const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),

    registeruser)

router.route("/login").post(loginuser)

router.route("/logout").post(verifyjwt, logoutuser)
router.route("/refreshtoken").post(refreshacesstoken)


export default router