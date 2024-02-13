import {asynchandaler} from "../utils/asynchandaler.js"
import{apierror} from "../utils/apierror.js"
import {apiresponse} from "../utils/apiresponse.js"


const healthcheck = asynchandaler(async (req, res) => {
   if(req){
    res
    .status(200)
    .json( new apiresponse(
        200,
        {
         health:"ok",
         success:"true"
        },
        "healthStatus:good"
    ))
   }else{
     throw new apierror(400,"healthStatus:poor")
   }
})

export {
    healthcheck
    }