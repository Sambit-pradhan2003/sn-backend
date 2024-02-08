import { Router } from "express";
import { 
    registeruser,
    getcurrentuser,
    updateuseravatar, 
    loginuser,
    logoutuser,
    refreshacesstoken,
    changecurrentpassword, 
    updateaccountdetails, 
    updatecoverimage, 
    getuserchannelprofile, 
    getwatchhistory} from "../controllers/user.controller.js"
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
router.route("/changepassword").post(verifyjwt,changecurrentpassword)
router.route("/currentuser").get(verifyjwt,getcurrentuser)
router.route("/updateaccount").patch(verifyjwt,updateaccountdetails)
router.route("/updateavatar").patch(verifyjwt,upload.single("avatar"),updateuseravatar)
router.route("/updatecoverimage").patch(verifyjwt,upload.single("/coverimage"),updatecoverimage)
router.route("/c/:username").get(verifyjwt,getuserchannelprofile)
router.route("/history").get(verifyjwt,getwatchhistory)



export default router