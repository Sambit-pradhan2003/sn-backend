import mongoose from "mongoose"
import {Like} from "../models/like.model.js"
import {asynchandaler} from "../utils/asynchandaler.js"
import{apierror} from "../utils/apierror.js"
import {apiresponse} from "../utils/apiresponse.js"



const toggleVideoLike = asynchandaler(async (req, res) => {
  try {
      const {videoId} = req.params
      // toggle like on video
      const user = req.user?._id;
      if(!videoId) throw new apierror(400,"video id is missing");
  
      let like = await Like.findOne({
           video: new mongoose.Types.ObjectId(videoId),
           likedBy: new mongoose.Types.ObjectId(user)
      });
  
      if(!like){
         like = await Like.create({
              video:new mongoose.Types.ObjectId(videoId),
              likedBy:new mongoose.Types.ObjectId(user)
         })
  
         res.status(200)
         .json(
          new apiresponse(
              200
              ,like
              ,"video liked successFully"
          )
         )
      }else{
          const deletedLike = await Like.deleteOne(
              {
                  video: new mongoose.Types.ObjectId(videoId),
                  likedBy: new mongoose.Types.ObjectId(user)
              }
          )
  
          res.status(200)
          .json(
           new apiresponse(
               200
               ,deletedLike
               ,"video disliked successFully"
           )
          )
      }
  } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error while liking a video",
       originOfError:"like controller"
    })
  }
})

const toggleCommentLike = asynchandaler(async (req, res) => {
 try {
       const {commentId} = req.params
       // toggle like on comment 
       const user = req.user?._id;
       if(!commentId) throw new apierror(400,"video id is missing");
   
       let like = await Like.findOne({
           comment: new mongoose.Types.ObjectId(commentId),
            likedBy: new mongoose.Types.ObjectId(user)
       });
   
       if(!like){
          like = await Like.create({
               comment:new mongoose.Types.ObjectId(commentId),
               likedBy:new mongoose.Types.ObjectId(user)
          })
          res.status(200)
          .json(
           new apiresponse(
               200
               ,like
               ,"comment liked successFully"
           ))
       }else{
           const deletedLike = await Like.deleteOne(
               {
                   comment: new mongoose.Types.ObjectId(commentId),
                   likedBy: new mongoose.Types.ObjectId(user)
               }
           )
   
           res.status(200)
           .json(
            new apiresponse(
                200
                ,deletedLike
                ,"comment disliked successFully"
            )
           )
       }
   
 } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error while liking a comment",
       originOfError:"like controller"
    })
 }
})

const toggleTweetLike = asynchandaler(async (req, res) => {
    try {
        const {tweetId} = req.params
        // toggle like on tweet
        const user = req.user?._id;
        if(!tweetId) throw new apierror(400,"video id is missing");
    
        let like = await Like.findOne({
            tweet: new mongoose.Types.ObjectId(tweetId),
             likedBy: new mongoose.Types.ObjectId(user)
        });
    
        if(!like){
           like = await Like.create({
                tweet:new mongoose.Types.ObjectId(tweetId),
                likedBy:new mongoose.Types.ObjectId(user)
           })
           res.status(200)
           .json(
            new apiresponse(
                200
                ,like
                ,"tweet liked successFully"
            ))
        }else{
            const deletedLike = await Like.deleteOne(
                {
                    tweet: new mongoose.Types.ObjectId(tweetId),
                    likedBy: new mongoose.Types.ObjectId(user)
                }
            )
            res.status(200)
            .json(
             new apiresponse(
                 200
                 ,deletedLike
                 ,"tweet disliked successFully"
             )
            )
        }
    } catch (error) {
        res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error while liking a tweet",
       originOfError:"like controller"
    })
    }
})

const getLikedVideos = asynchandaler(async (req, res) => {
try {
        // get all liked videos
        const user = req.user?._id;
        
        const likedVideos = await Like.aggregate([
            {
                $match:{
                    likedBy:new mongoose.Types.ObjectId(user)
                }
            },{
                $match:{
                    video:{
                        $exists:true,
                        $ne:""
                    }
                }
            }
        ])
    
        if(likedVideos.length !== 0){
            return res.status(200)
            .json(
                new apiresponse(200,{
                    data:[]
                },"no liked videos")
            )
        }
    
        res.status(200)
        .json(
            new apiresponse(200,
                likedVideos,
                "videos liked by user are fetched")
        )
} catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error while fetching liked videos",
       originOfError:"like controller"
    })
}
})

// add , is the stuff liked in this instant add a comment and tweet lookup wrt vid and subscriber respectively  aur each component mei check karna padega ki like hai ki nhi 

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
