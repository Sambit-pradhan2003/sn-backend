import jwt from "jsonwebtoken"
import {apierror} from "../utils/apierror.js"
import {User} from "../models/user.model.js"
import { asynchandaler } from "../utils/asynchandaler.js";

export const verifyjwt=asynchandaler(async(req,res,next)=>{
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
     //console.log(token)
      if(!token){
          throw new apierror(401,"unauthorised request")
      }
      const decodedtoken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
     const user= await User.findById(decodedtoken._id).select("-password -refreshToken")
       if(!user){
          throw new apierror(401,"invalid acess token")
       }
       req.user=user
       next()
  } catch (error) {
    throw new apierror(401,error,"in auth middleware")
  }
})