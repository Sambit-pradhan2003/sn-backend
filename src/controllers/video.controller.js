import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {asynchandaler} from "../utils/asynchandaler.js"
import{apierror} from "../utils/apierror.js"
import {apiresponse} from "../utils/apiresponse.js"

import {uploadoncloudinary} from "../utils/cloudinary.js"
import fs from "fs";


const getAllVideos = asynchandaler(async (req, res) => {
   
    // get all videos based on query, sort, pagination
    // run a query -
    // we also check for query i.e. through which we can search from search bar 
    // also important take care of not showing videos with isPublic = false 
    // first check for page and limit 
    // sortBy - createdAt , views , duration 
    // sortType - ascending , descending 
    // sort by UserId i.e get all the videos of user
    
   try {
     const { page, limit, query, sortBy, sortType, userId } = req.query
     const pageOptions = {
         page : Number(page) || 0,
         limit : Number(limit) || 10
     }
 
     let pipelineArr = [
         {
             $match:{
                isPublished:true
             }
         },  
     ]

     if(query){
        pipelineArr.push(
            {  
               $match:{
                title:{
                    $regex:query,
                    $options: 'i'
                }
               }
            }
        )
     }
    
     if(sortBy){
         if(sortType == "ascending") {
             pipelineArr.push(
                 {
                     $sort: {
                       [sortBy]:1
                     }
                   }
             )
         }
         if(sortType == "descending") {
             pipelineArr.push(
                 {
                     $sort: {
                       [sortBy]:-1
                     }
                   }
             )
         }
     
     }
     if(userId){
        pipelineArr.push(
            {
                $match:{
                    owner : userId
                }
            }
        )
     }
     pipelineArr.push(
         {
             $lookup:{
                 from:"users",
                 localField:"owner",
                 foreignField:"_id",
                 as:"channel"
             }
         }
     )
     pipelineArr.push(
         {
             $unwind:"$channel"
         }
     )
     pipelineArr.push(
         {
             $project:{
                 _id : 1,
                 owner:1,
                 videoFile:1,
                 thumbnail:1,
                 title:1,
                 duration:1,
                 views:1,
                 channel:"$channel.username",
                 channelFullName:"$channel.fullName",
                 channelAvatar:"$channel.avatar",
                 createdAt:1
             }
         }
     )
     const result = await Video.aggregate(pipelineArr)
     .skip(pageOptions.limit * pageOptions.page)
     .limit(pageOptions.limit)
     
         
      res
      .status(200)
      .json(
         new apiresponse(
             200,
             result,
             "videos fetched successFully"
         )
      )
   } catch (error) {
    throw new apierror(500,error,"error at get all video")
   }
})

const publishAVideo = asynchandaler(async (req, res) => {
    // get video, upload to cloudinary, create video
    //req.user - user , check if there or not 
    //title , description , check if there not 
    //upload file on multer , check if there not 
    //local path from multer and upload it on cloudinary 
    //find video length etc from cloudinary 
    //if there is anything in is public then also update that 

   try {
     const { title, description } = req.body

     if(!req.files.videoFile || !req.files.thumbnail){
        if(req.files.videoFile){
            fs.unlinkSync(req.files?.videoFile[0]?.path)
        }
        if(req.files.thumbnail){
            fs.unlinkSync(req.files?.thumbnail[0]?.path)
        }
        throw new apierror(401,"either videoFile or thumbnail is missing");
     }
     const videoFileLocalPath = req.files?.videoFile[0]?.path;
     const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

     if(!title || !description){
        if(videoFileLocalPath){
            fs.unlinkSync(videoFileLocalPath)
        }
        if(thumbnailLocalPath){
            fs.unlinkSync(thumbnailLocalPath)
        }
        throw new apierror(401,"cannot publish video without title and description");
     }
     
     const ownerId = req.user?._id ;
     if(!ownerId) throw new apierror(401,"user not loggedin");
 
     const videoFile = await uploadoncloudinary(videoFileLocalPath);
     const thumbnail = await uploadoncloudinary(thumbnailLocalPath);
    
     if(!thumbnail || !videoFile) throw new apierror(500,"uploading error when uploading either video or thumbnail to cloudinary") ;
     
     const createdvideo = await Video.create({
         videoFile:videoFile.secure_url ,
         thumbnail:thumbnail.secure_url ,
         owner:ownerId,
         title,
         description,
         duration:videoFile.duration ,
         isPublic:req.body.isPublic == "false" ? false : true
        
     })
     if(!createdvideo){
        throw new apierror(500,"something went wrong")
    }
     return res
     .status(201)
     .json(
         new apiresponse(201,createdvideo,"video is published")
     )
   } catch (error) {
     res
     .status(error?.statusCode||500)
     .json({
        status:error?.statusCode||500,
        message:error?.message||"some error in publishing video"
     })
   }

})

const getVideoById = asynchandaler(async (req, res) => {
   try {
     const { videoId } = req.params
     // get video by id
 console.log(videoId)
     if(!videoId) throw new apierror(400,"videoId missing");
     
     const video = await Video.findOneAndUpdate({
         _id: new mongoose.Types.ObjectId(videoId)
     },{
         $inc:{views:1}
     },{
         new:true
     })
     console.log(video,"ghjh")
    
     // can update this so that owner can only see through id
     if(!video || !video?.isPublished) throw new apierror(400,`video with this ${videoId} is not available`)

     const userId = req.user?._id;
     console.log(userId)
     const user = await User.findById(userId);
     console.log(user)
     
     user.watchHistory.push(videoId);
     await user.save({
        validateBeforeSave:false
     })

     res.status(200)
     .json(new apiresponse(200,video,"got video from id"))
   } catch (error) {
    throw new apierror(500,error,"something went wrong when get video by id")
   }
})

const updateVideo = asynchandaler(async (req, res) => {
   try {
     const { videoId } = req.params
     // update video details like title, description, thumbnail
     if(!videoId) throw new apierror(400,"videoId missing");
     
     const {title,description} = req.body ;
     const thumbnailLocalPath = req.file?.path;
     if(!title && !description && !thumbnailLocalPath)
     throw new apierror(400,"either send updated title ,description or thumbnail");
     
     const userId = req.user._id;
     if(!userId) throw new apierror(400,"user not logged in");
 
     const video = await Video.findById(videoId);
 
     if(!video) throw new apierror(400,"video with this videoId is missing")
     const ownerId = video?.owner;
     const permission = JSON.stringify(ownerId) == JSON.stringify(userId);
     console.log(JSON.stringify(ownerId),JSON.stringify(userId))
 
     if(!permission) throw new apierror(400,"login with owner id");
     
     if(thumbnailLocalPath){ 
         var thumbnail = await uploadoncloudinary(thumbnailLocalPath);
     }
     
     const updatedObj = {};
     if(title) updatedObj.title = title;
     if(description) updatedObj.description = description;
     if(thumbnailLocalPath) updatedObj.thumbnail = thumbnail.secure_url ;
     
 
     const updatedVideo = await Video.findByIdAndUpdate(
         new mongoose.Types.ObjectId(videoId),
         updatedObj,
         {
             new:true
         }
     )
 
     res.status(200)
     .json( 
         new apiresponse(200,updatedVideo,"video updated successFully")
     ) ;
 
   } catch (error) {
     
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in updating the video"
    })

   }

})

const deleteVideo = asynchandaler(async (req, res) => {
    // delete video
   try {
     const { videoId } = req.params
     console.log(videoId)
     
     if(!videoId) throw new apierror(400,"videoId missing");
     
     if(!req.user) throw new apierror(400,"user not loggedIn");
 
     const userId = req.user._id;
     const video = await Video.findById(videoId);
     if(!video) throw new apierror(400,"video with this videoId is missing")
     const ownerId = video?.owner;
     // console.log(new String(userId));
     // console.log(JSON.stringify(ownerId));
 
     if(JSON.stringify(ownerId) !== JSON.stringify(userId)) throw new apierror(400,"login with owner id")
 
     const deleted = await Video.findByIdAndDelete(new mongoose.Types.ObjectId(videoId));
     console.log(deleted)
 
     return res
     .status(200)
     .json(
         new apiresponse(200,{info:`video : ${video.title} is deleted`},"video deleted successFully")
     )
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in deleting a video"
    })
   }
})

const togglePublishStatus =asynchandaler(async (req, res) => {
   try {
     const { videoId } = req.params
     // check if video is present and user  is logged in 
     // check if the owner is the one who is toggling the status
     // then if all conditions are satisfied then toggle it
     if(!videoId) throw new apierror(400,"videoId is absent");
 
     const video = await Video.findById(videoId);
     if(!video) throw new apierror(400,"video with this videoId is missing");
     const ownerId = video?.owner;
 
     const userId = req.user?.id;
     if(!userId)throw new apierror(400,"user is not logged in");
 
     const permission = JSON.stringify(userId) == JSON.stringify(ownerId);
 
     if(!permission) throw new apierror (400,"for toggling video status login with owner id");
 
     const updatedUser = await Video.findByIdAndUpdate(
         new mongoose.Types.ObjectId(videoId),
         {
            isPublished: video.isPublished? false :true  
         },
         {
             new : true 
         }
     )
     
     res
     .status(200)
     .json(
         new apiresponse(
             200,
             updatedUser,
             `${video._id} toggle to ${video.isPublic?false:true}`
         )
     )
     
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in deleting a video"
    })
   }

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}