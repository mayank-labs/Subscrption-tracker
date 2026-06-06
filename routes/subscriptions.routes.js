import {Router} from "express";

const subscriptionRouter = Router();

subscriptionRouter.get('/' , (req,res) => res.send({title:"GET all subscriptions"}));
subscriptionRouter.get('/;id' , (req,res) => res.send({title:"GET user subscriptions"}));
subscriptionRouter.post('/' , (req,res) => res.send({title:"CREATE new subscriptions"}));
subscriptionRouter.put('/:id' , (req,res) => res.send({title:"UPDATE user subscriptions"}));
subscriptionRouter.delete('/:id' , (req,res) => res.send({title:"DELETE user subscriptions"}));
subscriptionRouter.get('/users/:id' , (req,res) => res.send({title:"GET users subscriptions"}));
subscriptionRouter.put('/:id/cancel' , (req,res) => res.send({title:"CANCEL subscriptions"}));
subscriptionRouter.get('/upcoming-renewals' , (req,res) => res.send({title:"GET upcoming subscriptions"}));

export default subscriptionRouter;