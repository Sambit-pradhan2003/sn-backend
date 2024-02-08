import {asynchandaler} from "../utils/asynchandaler.js"
import{apierror} from "../utils/apierror.js"
import {User} from "../models/user.model.js"
import{uploadoncloudinary} from "../utils/cloudinary.js"
import {apiresponse} from "../utils/apiresponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


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


const changecurrentpassword=asynchandaler(async(req,res)=>{
    const {oldpassword,newpassword}=req.body

    const user =await User.findById(req.user?._id)
    const ispasswordcorrect=await user.isPasswordCorrect(oldpassword)

    if(!ispasswordcorrect){
        throw new apierror(400,"invalid old password")
    }

    user.password=newpassword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(
        new apiresponse(200,"password changed sucessfully")
    )
})




const getcurrentuser=asynchandaler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current userfeatched sucessfully")
})



const updateaccountdetails=asynchandaler(async(req,res)=>{
    const {fullName,email}=req.body


    if(!fullName ||!email){
        throw new apierror(400,"all feilds are requrired")
    }
    const user =await User.findByIdAndUpdate(
        req,user?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },{new:true}
    )
    .select("-password")

    return res.status(200)
    .json(new apiresponse(200,user,"account detail updated sucessfully"))

})



const updateuseravatar=asynchandaler(async(req,res)=>{
    const avatarlocalpath=req.file?.path

    if(!avatarlocalpath){
        throw new apierror(400,"avatarfile missing")
    }


    const avatar=await uploadoncloudinary(avatarlocalpath)

    if(!avatar.url){
        throw new apierror(400,"error while uploading avatar")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiresponse(200,user,"avatar updated")
    )
    
    
})

const updatecoverimsge=asynchandaler(async(req,res)=>{
    const coverlocalpath=req.file?.path

    if(!coverlocalpath){
        throw new apierror(400,"cover file missing")
    }


    const cover=await uploadoncloudinary(coverlocalpath)

    if(!cover.url){
        throw new apierror(400,"error while uploading cover")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                cover:cover.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiresponse(200,user,"cover image updated")
    )
    
    
})

const getuserchannelprofile= asynchandaler(async(req,res)=>{
    const {username}=req.params


    if(!username?.trim()){
        throw new apierror(400,"user name is missing")
    }

    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },{
            $lookup:{
                from:"Subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscibers"
            }
        },{
            $lookup:{
                from:"Subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedto"
            }
        },{
            $addFields:{
                subscriberscount:{
                    $size:"$subscibers"
                },
                channelsubscibedtocount:{
                    $size:"$subscribedto"
                },
                issubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscibers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },{
            $project:{
                fullName:1,
                username:1,
                subscriberscount:1,
                channelsubscibedtocount:1,
                issubscribed:1,
                avatar:1,
                coverImage:1,
                email:11

            }
        }
    ])

    if(!channel?.length){
        throw new apierror(400,'channel not exist')
    }
    return res.status(200)
    .json(
        new apiresponse(200,channel[0],"user channel crate sucessfully")
    )
})

const getwatchhistory=asynchandaler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchhistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },{
                    $addFields:{
                        owner:{
                           $first:"$owner" 
                        }
                    }}

                ]
            }
        }
    ])
    return res.status(200)
    .json(new apiresponse(200,user[0].watchHistory,"watchhistory featchedbsucessfully"))
})

export {
    registeruser,
    loginuser,
    logoutuser,
    refreshacesstoken,
    changecurrentpassword,
    updateaccountdetails,
    updatecoverimsge,
    updateuseravatar,
    getuserchannelprofile,
    getwatchhistory
    }