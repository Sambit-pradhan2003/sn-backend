import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {asynchandaler} from "../utils/asynchandaler.js"
import{apierror} from "../utils/apierror.js"
import {apiresponse} from "../utils/apiresponse.js"



const getChannelStats = asynchandaler(async (req, res) => {
    // Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const totalViews = await Video.aggregate([
        {
            $match:{
                owner : new mongoose.Types.ObjectId(req.user?._id)
              }
        },{
            $group:
                {
                    _id: null,
                    totalViews: {
                      $sum: "$views"
                    },
                    totalVideos:{
                        $sum:1
                    }
            }
        }
    ])

 
    const totalVideoLikes = await Like.aggregate   (
        [
          {
            $match: {
              video: { $exists: true, $ne: '' }
            }
          },
          {
            $lookup: {
              from: 'videos',
              localField: 'video',
              foreignField: '_id',
              as: 'likedVideo'
            }
          },
          { $unwind: { path: '$likedVideo' } },
          {
            $match: {
              'likedVideo.owner': new mongoose.Types.ObjectId(
                '65b63db59ea6a235c4b6ece1'
              )
            }
          },
          {
            $group: {
              _id: null,
              totalLikes: { $sum: 1 }
            }
          }
        ]
     //  , { maxTimeMS: 60000, allowDiskUse: true }
      );
    // add total likes and total subscribers also 
    const totalSubscribers = await Subscription.aggregate([
        {
            $match:{
               channel: new mongoose.Types.ObjectId(req.user?._id)
            }
        },{
            $group:{
                _id:null,
                subscriberCount:{
                    $sum:1
                }
            }
        }
    ]);

    res.status(200)
    .json(
        new apiresponse(200,{
            totalViews:totalViews,
            totalVideoLikes:totalVideoLikes,
            totalSubscribers:totalSubscribers
        })
    )
    
})

const getChannelVideos = asynchandaler(async (req, res) => {
    //  Get all the videos uploaded by the channel also the isPublic false video but also 
    const userId = req.user?._id;
    const videos = await Video.aggregate([
        {
           $match:{
             owner:new mongoose.Types.ObjectId(userId)
           }
        }
    ]);
    res.status(200)
    .json(
        new apiresponse(200,videos,"videos fetched successfully for user: ",userId)
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }