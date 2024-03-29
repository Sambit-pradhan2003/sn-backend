import mongoose from "mongoose"
import {comment} from "../models/comment.model.js"
import {asynchandaler} from "../utils/asynchandaler.js"
import{apierror} from "../utils/apierror.js"
import {apiresponse} from "../utils/apiresponse.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asynchandaler(async (req, res) => {
   try {
     // get all comments for a video
     const {videoId} = req.params
     console.log(videoId)
     const {page, limit} = req.query;
     
     const pageOptions = {
         page: parseInt(page, 10) || 0,
         limit: parseInt(limit, 10) || 15
     }
     if(!videoId) throw new apierror(400,"video id is absent");
    
     // console.log()
    // no point of checking for video further database calls 
     const comments = await comment.aggregate([
        {
         $match:{
             video:new mongoose.Types.ObjectId(videoId)
         }
        }
     ]).skip(pageOptions.page * pageOptions.limit).limit(pageOptions.limit);
     //console.log(comments)
     if(comments.length == 0) throw new apierror(400,"no comments found");
     
     res.status(200)
     .json(
        new apiresponse(
         200,
         comments,
         "comments fetched successfully"
        )
     )
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error while getting video comments",
       originOfError:"comment controller"
    })
   }

})

const addComment = asynchandaler(async (req, res) => {
try {
        //  add a comment to a video
    
        const {videoId} = req.params;
        const owner = req.user?._id;
        const {content} = req.body;
        
        if(!owner) throw new apierror(400,"login to post comment")
        if(!content) throw new apierror(400,"cant post comment without content")
        if(!videoId) throw new apierror(400,"video id not present");
        const video = await Video.aggregate([
            {
                $match:{
                    isPublic:true
                }
            },{ 
                $match:{
                    _id:new mongoose.Types.ObjectId(videoId)
                }
                
            }
        ]);
        console.log(video)
    
        if(!video) throw new apierror(404,"video with this id not available");
    
        const newcomment = await comment.create({
              content,
              video:videoId,
              owner
        })
        console.log(newcomment)
    
        res.status(200)
        .json(
            new apiresponse(
                200
                ,newcomment
                ,"comment is posted")
        )
    
} catch (error) {
    throw new apierror(500,error) 
}
})

const updateComment = asynchandaler(async (req, res) => {
  try {
      //  update a comment
      const {commentId} = req.params;
      const userId = req.user?._id;
      const {content}= req.body ;
      const updatedContent = content;
      
      if(!userId) throw new apierror(400,"login to post comment")
      if(!updatedContent) throw new apierror(400,"cant update comment without new content")
      if(!commentId) throw new apierror(400,"comment id is not present");
  
      const acomment = await comment.findById(commentId);
      if(!acomment) throw new apierror(404,"comment with this id is not present");
  
      const permission = JSON.stringify(acomment?.owner) == JSON.stringify(userId);
      if(!permission) throw new apierror(400,"login with owner id");
      
      const updatedComment = await comment.findByIdAndUpdate(
          commentId,
          {
              content:updatedContent
          },{
              new:true
          }
      )
      
      res.status(200)
      .json(
          new apiresponse(
              200,
              updatedComment,
              "comment is updated"
              )
      )
  } 
  catch (error) {
    throw new apierror(500,error)
  }
})

const deleteComment = asynchandaler(async (req, res) => {
   try {
     // delete a comment
     const {commentId} = req.params;
     const userId = req.user?._id;
    
     
     if(!userId) throw new apierror(400,"login to post comment")
  
     if(!commentId) throw new apierror(400,"comment id is not present");
 
     const dcomment = await comment.findById(commentId);
     if(!dcomment) throw new apierror(404,"comment with this id is not present");
 
     const permission = JSON.stringify(dcomment?.owner) == JSON.stringify(userId);
     if(!permission) throw new apierror(400,"login with owner id");
 
     await comment.findByIdAndDelete(commentId);
     
     res.status(200)
     .json(
         new apiresponse(200,{
             deletedComment:commentId,
             success:true
         },
         "comment deleted"
         )
     )
   } catch (error) {
    throw new apierror(500,error)
   }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }