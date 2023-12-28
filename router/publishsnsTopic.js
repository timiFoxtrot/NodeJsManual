require('dotenv').config();
const AWS = require("aws-sdk");
const sns = new AWS.SNS();
const submitVehicleTopic = async (newData,documentStatus) => {
    const toPublish={
        ...newData,
        messageInfo: {
            documentStatus: documentStatus,
            origin: 'vams2.0'
          },
          lastUpdateTime: new Date().toISOString(),
          messageType: "activated",
    };
    delete toPublish['documentStatus'];
    delete toPublish['_id'];
    const vehicleParam = {
        Message: JSON.stringify(toPublish),
        TopicArn: process.env.VEHICLE_SNS,
    };
    // console.log("Topic",process.env.VEHICLE_SNS)
    return await sns
        .publish(vehicleParam)
        .promise()
        .then((data) => {
            console.log('Message ID', data, 'has been sent');
            return data;
        })
        .catch((err) => {
            console.error(err, err.stack);
            return err;
        });
};
const submitVehicleTopicv1 = async (newData,documentStatus) => {
    const toPublish={
        ...newData,
        messageInfo: {
            documentStatus: documentStatus,
            manualImport: "True",
            origin: 'vams2.0'
          },
          lastUpdateTime: new Date().toISOString(),
          messageType: "activated",
    };
    delete toPublish['documentStatus'];
    delete toPublish['_id'];
    const vehicleParam = {
        Message: JSON.stringify(toPublish),
        TopicArn: process.env.VEHICLE_SNS,
    };
    // console.log("Topic",process.env.VEHICLE_SNS)
    return await sns
        .publish(vehicleParam)
        .promise()
        .then((data) => {
            console.log('Message ID', data, 'has been sent');
            return data;
        })
        .catch((err) => {
            console.error(err, err.stack);
            return err;
        });
};

module.exports = {submitVehicleTopic}