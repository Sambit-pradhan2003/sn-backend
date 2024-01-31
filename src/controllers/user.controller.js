import {asynchandaler} from "../utils/asynchandaler.js"
import{apierror} from "../utils/apierror.js"
import {User} from "../models/user.model.js"
import{uploadoncloudinary} from "../utils/cloudinary.js"
import {apiresponse} from "../utils/apiresponse.js"


const registeruser= asynchandaler(async (req,res)=>{
   
    //get user detail from frontend
    //validation
    //cheack if user alredsy exist
    //cheack for images avtar
    //upload them to cloudinary
    //create user object-create entry in db
    //remove password and refresh token feild 
    //cheack user creation 
    //return res

    const {fullname,email,username,password}=req.body

    if([fullname,email,username,password].some((field)=>field?.trim()==="")){
        throw new apierror(400,"all feilds are required")
    }


     const existeduser=User.findOne({
        $or:[{email},{username}]
    })

    if(existeduser){
        throw new apierror(409,"user name alredy exist")
    }



    const avatarlocalpath=req.files?.avatar[0]?.path
    const coverimagelocalpath= req.files?.coverimage[0]?.path;

    if(!avatarlocalpath){
        throw new apierror(404,"avataris required")

    }





    const avatar=await uploadoncloudinary(avatarlocalpath)
    const coverImage=await uploadoncloudinary(coverimagelocalpath)
    
    if(!avatar){
        throw new apierror(404,"avataris required")
    }



    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()

    })

    const createduser= await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createduser){
        throw new apierror(500,"something went wrong")
    }


    return res.status(201).json(
        new apiresponse(200,createduser,"user registered sucessfully")
    )

})

export {registeruser}