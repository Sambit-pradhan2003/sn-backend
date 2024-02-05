import {asynchandaler} from "../utils/asynchandaler.js"
import{apierror} from "../utils/apierror.js"
import {User} from "../models/user.model.js"
import{uploadoncloudinary} from "../utils/cloudinary.js"
import {apiresponse} from "../utils/apiresponse.js"
import jwt from "jsonwebtoken"


const generateacesstokebandrefreshtoken= (async (userid)=>{
    try {
        const user=await User.findById(userid)
        const acessToken=user.generateAccessToken()
        const refreshToken =user.generateRefreshToken()
        //console.log(acessToken," at gt rt",refreshToken)

        user.refreshToken=refreshToken

        await user.save({validateBeforeSave:false})
        return{acessToken,refreshToken}
    } catch (error) {
        throw new apierror(500,error,"something wennt wrong while generating at and rt")
    }
})

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

    const {fullName,email,username,password}=req.body

    if([fullName,email,username,password].some((field)=>field?.trim()==="")){
        throw new apierror(400,"all feilds are required")
    }


     const existeduser= await User.findOne({
        $or:[{email},{username}]
    })

    if(existeduser){
        throw new apierror(409,"user name alredy exist")
    }



    const avatarlocalpath=req.files?.avatar[0]?.path;
    let coverimagelocalpath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverimagelocalpath = req.files.coverImage[0].path
    }

    if(!avatarlocalpath){
        throw new apierror(404,"avataris required")

    }




    const avatar=await uploadoncloudinary(avatarlocalpath)
    const coverImage=await uploadoncloudinary(coverimagelocalpath)
    
    if(!avatar){
        throw new apierror(404,"avataris required")
    }



    const user=await User.create({
        fullName,
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


const loginuser=asynchandaler(async(req,res)=>{
    const {email,username,password}=req.body
    console.log(username,email,password)


    if(username && !email){
        throw new apierror(400,"username and email required")
    }


    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new apierror(404,"user not find")
    }


    const ispasswordvalid=await user.isPasswordCorrect(password)


    if(!ispasswordvalid){
        throw new apierror(401,"invalid user credential")
    };

    const { acessToken, refreshToken }=await generateacesstokebandrefreshtoken(user._id)
    //console.log(acessToken,"hg nkjnhkj kkjh ",refreshToken)


    const logedinuser=await User.findById(user._id).select("-password -refreshToken")
     
    const options={
        httpOnly:true,
        secure:true
    }
    
    
    return res
    .status(200)
    .cookie("accessToken", acessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiresponse(
            200,
            {
                user:logedinuser,acessToken,refreshToken
            },
            "user logged in sucessfully"
        )
    )



})

const logoutuser=asynchandaler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $set:{refreshToken:undefined}
    },{
        new:true
    }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res 
    .status(200)
    .clearCookie("acessToken")
    .clearCookie("refreshToken")
    .json(new apiresponse(200,{},"user logged out"))
})

const refreshacesstoken= asynchandaler(async(req,res)=>{

    const incommingrefreshtoken= req.cookies.refreshToken || req.body.refreshToken
    console.log(incommingrefreshtoken)

    if(!incommingrefreshtoken){
        throw new apierror(401,"unauthorised request")
    }

    try {
        const decodedtoken=jwt.verify(incommingrefreshtoken,process.env.REFRESH_TOKEN_SECRET)
    
        const user=await User.findById(decodedtoken?._id)
    
        if(!user){
            throw new apierror(401,"inva;id refresh token")
        }
    
        if(incommingrefreshtoken!==user?.refreshToken){
            throw new apierror(401, "Refresh token is expired");
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const{acessToken,newrefreshToken}=await generateacesstokebandrefreshtoken(user._id)
    
    
        return res
        .status(200)
        .cookie("accessToken", acessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new apiresponse(
                200,
                {
                acessToken,newrefreshToken
                },
                "refreshtoken refreshed"
            )
        )
    } catch (error) {
        throw new apierror(401,error)
        
    }

})

export {
    registeruser,
    loginuser,
    logoutuser,
    refreshacesstoken}