const AWS = require("aws-sdk");
AWS.config.update({ region: "eu-west-2" });
const express=require('express');
const router=express.Router();
const sns = new AWS.SNS();
const fs=require("fs");
const path=require("path")
router.post('/stage/awsVehicle',async(req,res)=>{
    const {body}= req;
    try{
        const paramMeter = {
            Message: JSON.stringify(body),
            TopicArn: "arn:aws:sns:eu-west-2:048464312507:Vehicle",
            MessageAttributes:{
                origin: { DataType: 'String' , StringValue: 'vams1.0'}
            }
          };
        const response=await sns.publish(paramMeter).promise();
        return res.status(200).json({
            body:body,
            message:response
        })
    }catch(err){
        return res.status(400).json({
            message:err
        })
    }
});
router.post('/stage/awsTimeOff',async(req,res)=>{
    const {body}= req;
    try{
        const paramMeter = {
            Message: JSON.stringify(body),
            TopicArn: "arn:aws:sns:eu-west-2:048464312507:TimeOff",
            MessageAttributes:{
                origin: { DataType: 'String' , StringValue: 'vams1.0'}
            }
          };
        const response=await sns.publish(paramMeter).promise();
        return res.status(200).json({
            body:body,
            message:response
        })
    }catch(err){
        return res.status(400).json({
            message:err
        })
    }
});
router.post('/stage/awsDeactivation',async(req,res)=>{
    const {body}= req;
    try{
        const paramMeter = {
            Message: JSON.stringify(body),
            TopicArn: "arn:aws:sns:eu-west-2:048464312507:Deactivate",
          };
        const response=await sns.publish(paramMeter).promise();
        return res.status(200).json({
            body:body,
            message:response
        })
    }catch(err){
        return res.status(400).json({
            message:err
        })
    }
});
router.post('/stage/awsRetrieval',async(req,res)=>{
    const {body}= req;
    try{
        const paramMeter = {
            Message: JSON.stringify(body),
            TopicArn: "arn:aws:sns:eu-west-2:048464312507:Retrieval",
          };
        const response=await sns.publish(paramMeter).promise();
        return res.status(200).json({
            body:body,
            message:response
        })
    }catch(err){
        return res.status(400).json({
            message:err
        })
    }
});

router.get('/stage/republishChampion',async(req,res)=>{
    return fs.readFile("/home/debanil/Documents/NodeJSForTesting/tosendToChampion.json", 'utf8', async function(err, data){
        if(err) console.error(err);
        const toSend=JSON.parse(data);
        const consolidate=[];
        for(const d of toSend){
            const championTopic = {
                champion_uuid_id: d?.champion_uuid_id,
                champion_id: d?.champion_id,
                prospect_id: d?.prospect_id,
                vehicle_id: d?.vehicle_id,
                "lastUpdateTime": "2022-12-06T16:17:47.913Z",
                "messageInfo": {
                    "documentStatus": "Activated",
                    "origin": "cs"
                }
            };

            const paramMeter = {
                Message: JSON.stringify(championTopic),
                TopicArn: "arn:aws:sns:eu-west-2:616626909445:Champion",
              };
              const response=await sns.publish(paramMeter).promise();
              consolidate.push({championPushed: championTopic, message:response})
        }

        res.status(200).send(consolidate);
    });
});
router.post('/stage/awsProspect',async(req,res)=>{
    const {body}= req;
    try{
        const paramMeter = {
            Message: JSON.stringify(body),
            TopicArn: "arn:aws:sns:eu-west-2:048464312507:Prospect",
            MessageAttributes:{
                origin: { DataType: 'String' , StringValue: body?.messageInfo?.origin }
            }
          };
        const response=await sns.publish(paramMeter).promise();
        return res.status(200).json({
            body:body,
            message:response
        })
    }catch(err){
        return res.status(400).json({
            message:err
        })
    }
});

router.post('/stage/awsMaintenance',async(req,res)=>{
    const {body}= req;
    try{
        const paramMeter = {
            Message: JSON.stringify(body),
            TopicArn: "arn:aws:sns:eu-west-2:048464312507:Maintainence",
          };
        const response=await sns.publish(paramMeter).promise();
        return res.status(200).json({
            body:body,
            message:response
        })
    }catch(err){
        return res.status(400).json({
            message:err
        })
    }
});

router.post('/prod/awsVehicle',async(req,res)=>{
    AWS.config.update({ roleARN : "arn:aws:iam::616626909445:user/debanil" });
    const {body}= req;
    try{
        const paramMeter = {
            Message: JSON.stringify(body),
            TopicArn: "arn:aws:sns:eu-west-2:616626909445:Vehicle",
          };
        const response=await sns.publish(paramMeter).promise();
        return res.status(200).json({
            body:body,
            message:response
        })
    }catch(err){
        return res.status(400).json({
            message:err
        })
    }
});
router.post('/prod/awsProspect',async(req,res)=>{
    const {body}= req;
    try{
        const paramMeter = {
            Message: JSON.stringify(body),
            TopicArn: "arn:aws:sns:eu-west-2:616626909445:Prospect",
          };
        const response=await sns.publish(paramMeter).promise();
        return res.status(200).json({
            body:body,
            message:response
        })
    }catch(err){
        return res.status(400).json({
            message:err
        })
    }
});



module.exports= router;