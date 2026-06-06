import Subscription from "../models/subscription.model";

export const createSubscription = (req, res,next) => {
    try{
        const subscription = await Subscription.create({...req.body, user: req.user._id});

    }catch(error){
        next(error);
    }
}