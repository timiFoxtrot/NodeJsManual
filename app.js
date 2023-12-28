const express=require('express');
const AWS = require("aws-sdk");
require('dotenv').config();
AWS.config.loadFromPath('./prod.json');
const bodyParser=require('body-parser');
const app=express();
const morgan =require('morgan');
app.use(morgan('combined'));
const {PORT = 4000} = process.env;
var multer  = require('multer');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const routes=require('./router/awsStaging');
const fileroutes=require('./router/bulkupload');
AWS.config.update({ region: "eu-west-2" });
app.use(bodyParser.json());
app.use('/v1',routes);
app.use('/file',fileroutes);


app.listen(PORT,()=>{
    console.log(`Server was listening to ${PORT}`);
})