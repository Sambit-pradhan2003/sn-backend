import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import {verifyjwt} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyjwt); // Apply verifyJWT middleware to all routes in this file

router.route("/t").post(createTweet);
router.route("/u/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router