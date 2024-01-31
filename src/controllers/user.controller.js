import {asynchandaler} from "../utils/asynchandaler.js"


const registeruser= asynchandaler(async (req,res)=>{
    res.status(200).json({
        message:ok
    })
})

export {registeruser}