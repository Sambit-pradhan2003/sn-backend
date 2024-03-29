import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/plalist.model.js"
import {asynchandaler} from "../utils/asynchandaler.js"
import{apierror} from "../utils/apierror.js"
import {apiresponse} from "../utils/apiresponse.js"

import { Video } from "../models/video.model.js"


const createPlaylist = asynchandaler(async (req, res) => {
  try {
      const {name, description} = req.body
      
      // create playlist
      if(!name || !description) throw new apierror(400,"enter both name and description of playlist") 
  
      const ownerId = req.user?._id;
  
      if(!ownerId) throw new apierror(400,"user should login ");
  
      const playlist = await Playlist.create({
          name,
          description,
          owner:ownerId
      });
  
      res
      .status(200)
      .json(
          new apiresponse(200,playlist,"playlist is created")
      )
  
  } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in creating playlist",
       originOfError:"playlist controller"
    })
  }
})

const getUserPlaylists = asynchandaler(async (req, res) => {
 try {
       const {userId} = req.params
       // get user playlists
   
       if(!userId) throw new apierror(400,"userId is absent");
   
       const playlists = await Playlist.aggregate([
           {
               $match:{
                   owner:new mongoose.Types.ObjectId(userId)
               }
           }
       ]);
   
       res
       .status(200)
       .json(
           new apiresponse(200,playlists,"playlists fetched")
       )
 } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in fetching a users playlists",
       originOfError:"playlist controller"
    })
 }

})

const getPlaylistById = asynchandaler(async (req, res) => {
   try {
     const {playlistId} = req.params
     // get playlist by id 
     if(!playlistId) throw new apierror(400,"playlist id is not present");
 
     const playlist = await Playlist.findById(playlistId);
     if(!playlist) throw new apierror(400,"playlist with this id not available");
 
     res.status(200)
     .json(
         new apiresponse(200,playlist,"playlist found")
     )
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error in fetching a playlist through id",
       originOfError:"playlist controller"
    })
   }
})

const addVideoToPlaylist = asynchandaler(async (req, res) => {
    try {
        const {playlistId, videoId} = req.params
        
        if(!playlistId ||!videoId) throw new apierror(400,"playlist and videoId not passed")
        const userId = req.user?._id
        if(!userId) throw new apierror(400,"user not logged in")
        
        const playlist = await Playlist.findById(playlistId);
        if(!playlist) throw new apierror(400,"playlist with this id is not present");
    
        const ownerId = playlist.owner;
        const permission = JSON.stringify(userId) === JSON.stringify(ownerId);
        
        if(!permission) throw new apierror('login with owner id to add video to playlist');
        const video = await Video.findById(videoId)
        console.log(video)
        playlist.videos.push(video._id);
        const updatedVideosArr = playlist.videos;
        console.log(updatedVideosArr)
        // can also just save it that is save playlist 
        // await playlist.save() check this 
        // can also give out a better array with video info 
        const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
            {
                videos:updatedVideosArr
            },{
                new:true
            }
            )
    
            res.status(200)
            .json(
                new apiresponse(200,updatedPlaylist)
            )
    } catch (error) {
        res
        .status(error?.statusCode||500)
        .json({
           status:error?.statusCode||500,
           message:error?.message||"some error in adding a video to playlist",
           originOfError:"playlist controller"
        })
    }
})

const removeVideoFromPlaylist = asynchandaler(async (req, res) => {
   try {
     const {playlistId, videoId} = req.params
     //  remove video from playlist
     
     if(!playlistId ||!videoId) throw new apierror(400,"playlist and videoId not passed")
     const userId = req.user?._id
     if(!userId) throw new apierror(400,"user not logged in")
     
     const playlist = await Playlist.findById(playlistId);
     if(!playlist) throw new apierror(400,"playlist with this id is not present");
 
     const ownerId = playlist.owner;
     const permission = JSON.stringify(userId) === JSON.stringify(ownerId);
     
     if(!permission) throw new apierror('login with owner id to delete a video from playlist');
     //  check this method
     // if error try JSON.stringify
     // console.log(typeof JSON.stringify(playlist.videos[0]._id))
     // console.log(typeof videoId)
     // playlist.videos.forEach(video => {
     //     console.log(JSON.stringify(video._id))
     //     console.log(JSON.stringify(video._id) !== JSON.stringify(videoId))
     // })
     // can also add a method of deleting only one video of a an id 
 
     const updatedVideosArr = playlist.videos.filter(video => JSON.stringify(video._id) !== JSON.stringify(videoId));
     // console.log(updatedVideosArr);
     
     const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,{
         videos:updatedVideosArr
     },{
         new:true
     })
 
     res.status(200)
     .json(
         new apiresponse(200,updatedPlaylist,"video deleted from the playlist")
     )
 
     // first just console.log playlist object 
     // await Playlist.updateOne({
     //     _id:new mongoose.Types.ObjectId()
     // })
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error while removing video from playlist",
       originOfError:"playlist controller"
    })
   }

})

const deletePlaylist = asynchandaler(async (req, res) => {
   try {
     const {playlistId} = req.params
     //  delete playlist
     if(!playlistId) throw new apierror(400,"playlist not passed")
     const userId = req.user?._id
     if(!userId) throw new apierror(400,"user not logged in")
     
     const playlist = await Playlist.findById(playlistId);
     if(!playlist) throw new apierror(400,"playlist with this id is not present");
 
     const ownerId = playlist.owner;
     const permission = JSON.stringify(userId) === JSON.stringify(ownerId);
     
     if(!permission) throw new apierror('login with owner id to delete a playlist');
 
     await Playlist.findByIdAndDelete(playlistId);
 
     res.status(200)
     .json(
         new apiresponse(200,{
             success:true,
         },"playlist is deleted")
     )
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error while deleting a playlist",
       originOfError:"playlist controller"
    })
   }

})

const updatePlaylist = asynchandaler(async (req, res) => {
   try {
     const {playlistId} = req.params
     const {name, description} = req.body
     // update playlist
 
     if(!name && !description) throw new apierror(400,"nothing to update in playList");
     if(!playlistId) throw new ApiError(400,"playlistId is absent");
 
     const userId = req.user?._id;
     if(!userId) throw new apierror(400,"user not loggedIn");
 
     const playlist = await Playlist.findById(playlistId);
     if(!playlist) throw new apierror(400,"playlist with this id not present");
     const ownerId = playlist.owner;
     const permission = JSON.stringify(userId) === JSON.stringify(ownerId);
 
     if(!permission) throw new apierror('login with owner id to updated a playlist');
 
     const updatedObj = {};
     if(name) updatedObj.name = name;
     if(description) updatedObj.description = description ;
     
     const updatedPlaylist = await Playlist.findByIdAndUpdate(
         playlistId,
         updatedObj,
         {
             new : true 
         }
     )
 
     res.status(200)
     .json(
         new apiresponse(200,updatedPlaylist,"playlist is updated")
     )
     
 
   } catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
       status:error?.statusCode||500,
       message:error?.message||"some error while updating the playlist",
       originOfError:"playlist controller"
    })
   }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}