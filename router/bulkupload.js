const AWS = require("aws-sdk");
AWS.config.update({ region: "eu-west-2" });
const express = require("express");
const router = express.Router();
const cliProgress = require("cli-progress");
const pub = require("./publishsnsTopic");
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const sns = new AWS.SNS();

const csv = require("csvtojson");

// router.use(parsecsv)
const vehicleJson = require("./route.json");
var multer = require("multer");
var storage = multer.memoryStorage();
var import_mongodb = require("mongodb");
var upload = multer({ storage: storage });
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const timeout = (time) => {
  new Promise((resolve, rej) => resolve(setTimeout(() => {}, time)));
};

router.post(
  "/upload/vehicle",
  upload.single("file"),
  async function (req, res) {
    console.log("handler triggered");
    let array;
    if (req.file.mimetype === "text/csv") {
      array = await csv().fromString(req.file.buffer.toString());
    }
    // console.log(req.body.role);
    var championCol = await getCollection("champions");
    var activationCol = await getCollection("activations");

    var vehicleCol = await getCollection("vehicles");
    bar1.start(array?.length, 0);
    const role = req?.body?.role;
    const newarr = [];
    const alreadyImported = [];
    const vehicleUpdateSuccess = [];
    const snspublished = [];
    let index = 0;
    console.log(array.length);
    let tmout;
    for (const data of array) {
      const champion = {
        champion_uuid_id: data?.champion_uuid_id,
        champion_id: data?.champion_id,
        vehicle_id: data?.vehicle_id,
        championName: data?.championName,
        championPhoneNumber: data?.championPhoneNumber,
        championEmailId: data?.championEmailId,
        lastUpdateTime: new Date().toISOString(),
        documentStatus: "Activated",
      };

      let response;
      const dataC = await championCol.findOne({
        champion_id: data?.champion_id,
      });
      console.log("Champion found", dataC?.champion_id);
      if (dataC?.champion_id) {
        console.log(`vehicle id ${data?.vehicle_id} updated`);
        response = await championCol.updateOne(
          { champion_id: data?.champion_id },
          { $set: champion }
        );
      } else {
        console.log(`vehicle id ${data?.vehicle_id} inserted`);
        console.log("Champion collection", !!championCol);
        response = await championCol?.insertOne(champion);
      }
      await sleep(2000);
      const dataA = await activationCol.findOne({
        vehicle_id: data?.vehicle_id,
      });
      const dataV = await vehicleCol.findOne({ vehicle_id: data?.vehicle_id });
      let responsevehicle;
      // dataC?.champion_id === undefined ||
      //   dataV?.champion_id !== dataC?.champion_id
      if (!dataV) {
        if (dataA?.documentStatus) {
          data["documentStatus"] = dataA?.documentStatus;
          await pub.submitVehicleTopic(data, dataA?.documentStatus);
        } else {
          data["documentStatus"] = "PickUpComplete";
          await pub.submitVehicleTopic(data, "PickUpComplete");
        }
        data["phoneNumber"] = "+234" + data["phoneNumber"];
        if (!data["phoneNumber"]) delete data["phoneNumber"];
        data["lastUpdateTime"] = new Date().toISOString();
        // if (!dataV["lastUpdateTime"]) {
        // }
        data["createdTime"] = new Date().toISOString();
        // if (!dataV["createdTime"]) {
        // }
        data["month"] = new Date().toLocaleString("default", {
          month: "long",
        });
        // if (!dataV["month"]) {
        // }
        data["mileage"] = 0;
        // if (!dataV["mileage"]) {
        // }
        data["odometerReading"] = 0;
        // if (!dataV["odometerReading"]) {
        // }
        data["vehicleStatus"] = "Active";
        // if (dataV["vehicleStatus"] !== "Active") {
        // }
        console.log({ data });
        try {
          responsevehicle = await vehicleCol.insertOne(data);
          console.log("Data Inserted:::::");
          // responsevehicle = await vehicleCol.updateOne(
          //   { vehicle_id: data?.vehicle_id },
          //   { $set: { ...data } }
          // );
        } catch (err) {
          responsevehicle = err;
        }
        console.log(
          `${dataC?.champion_id} = ${dataV?.champion_id} for vehicle ${dataV?.vehicle_id} is not there`
        );
        vehicleUpdateSuccess.push(dataV?.plateNumber);
        await sleep(488);
      }
      if (!!dataV?.champion_id == true) {
        console.log(
          `${dataV?.champion_id} for vehicle ${dataV?.vehicle_id} is there`
        );
        alreadyImported.push(dataV?.plateNumber);
      }
      newarr.push({
        "Response from champion": response,
        "Response from vehicle": responsevehicle,
      });
      bar1.increment(1);
    }

    bar1.stop();
    res.json({
      status: 200,
      totalDocuments: array.length,
      data: newarr,
      vehicleUpdateSuccess: vehicleUpdateSuccess,
      alreadyImported: alreadyImported,
    });
  }
);
router.post(
  "/upload/onlyVehicle",
  upload.single("file"),
  async function (req, res) {
    let array;
    if (req.file.mimetype === "text/csv") {
      array = await csv().fromString(req.file.buffer.toString());
    } else {
      throw "Not the file type required";
    }
    var newarr = [];
    var vehicleCol = await getCollection("vehicles");
    bar1.start(array?.length, 0);

    for (const data of array) {
      const data2 = await vehicleCol.findOne({
        plateNumber: data?.plateNumber,
      });
      if (data["championPhoneNumber"]?.includes("234")) {
        data["championPhoneNumber"] = "+".concat(data["championPhoneNumber"]);
      }
      if (!data2["lastUpdateTime"]) {
        data["lastUpdateTime"] = new Date().toISOString();
      }
      if (!data2["createdTime"]) {
        data["createdTime"] = new Date().toISOString();
      }
      if (!data2["createdTime"]) {
        data["createdTime"] = new Date().toISOString();
      }
      if (!data2["month"]) {
        data["month"] = new Date().toLocaleString("default", { month: "long" });
      }
      if (!data2["mileage"]) {
        data["mileage"] = 0;
      }
      if (!data2["odometerReading"]) {
        data["odometerReading"] = 0;
      }
      const responsevehicle = await vehicleCol.updateOne(
        { plateNumber: data?.plateNumber },
        { $set: { ...data } }
      );
      if (data) {
        await pub.submitVehicleTopic(data2, data2?.documentStatus);
      }

      newarr.push({
        "Response from vehicle": responsevehicle,
        plateNumber: data?.plateNumber,
      });
      bar1.increment(1);
    }

    bar1.stop();
    res.status(200).json({
      status: 200,
      totalDocuments: array.length,
      data: newarr,
    });
  }
);

router.post(
  "/upload/incomplete",
  upload.single("file"),
  async function (req, res) {
    let array;
    if (req.file.mimetype === "text/csv") {
      array = await csv().fromString(req.file.buffer.toString());
    } else {
      throw "Not the file type required";
    }
    var newarr = [];
    var vehicleCol = await getCollection("vehicles");
    bar1.start(array?.length, 0);

    for (const data of array) {
      const data2 = await vehicleCol.findOne({ vehicle_id: data?.vehicle_id });
      data["documentStatus"] = data["documentStatus"] || "Scrapped";
      let responsevehicle;
      if (!data2) {
        responsevehicle = await vehicleCol.insertOne(data);
        console.log(`${data["vehicle_id"]} inserted`);
        newarr.push({
          "Response from vehicle": responsevehicle,
          plateNumber: data?.plateNumber,
        });
        bar1.increment(1);
        continue;
      }
      if (!data2["lastUpdateTime"]) {
        data["lastUpdateTime"] = new Date().toISOString();
      }
      if (!data2["createdTime"]) {
        data["createdTime"] = new Date().toISOString();
      }
      if (!data2["createdTime"]) {
        data["createdTime"] = new Date().toISOString();
      }
      if (!data2["month"]) {
        data["month"] = new Date().toLocaleString("default", { month: "long" });
      }
      if (!data2["mileage"]) {
        data["mileage"] = 0;
      }
      if (!data2["odometerReading"]) {
        data["odometerReading"] = 0;
      }

      if (
        data2.documentStatus === "ReadyForActivation" ||
        data2.documentStatus === "UpdatedInfo"
      ) {
        responsevehicle = await vehicleCol.updateOne(
          { vehicle_id: data?.vehicle_id },
          { $set: { ...data } }
        );
        console.log(`${data["vehicle_id"]} inserted`);
      }
      if (data) {
        await pub.submitVehicleTopic(data2, data2?.documentStatus);
      }

      newarr.push({
        "Response from vehicle": responsevehicle,
        plateNumber: data?.plateNumber,
      });
      bar1.increment(1);
    }

    bar1.stop();
    res.status(200).json({
      status: 200,
      totalDocuments: array.length,
      data: newarr,
    });
  }
);
router.post(
  "/upload/transferprospect",
  upload.single("file"),
  async function (req, res) {
    try {
      let array;
      if (req.file.mimetype === "text/csv") {
        array = await csv().fromString(req.file.buffer.toString());
      } else {
        throw "Not the file type required";
      }
      var newarr = [];
      var activationCol = await getCollection("activations");
      var vehicleCol = await getCollection("vehicles");
      bar1.start(array?.length, 0);
      for (const data of array) {
        const facti = await activationCol.findOne({
          vehicle_id: data?.vehicle_id,
        });
        const responsevehicle = await vehicleCol.updateOne(
          { vehicle_id: data?.vehicle_id },
          { $set: { prospectLocation: facti?.prospectLocation } }
        );
        const data2 = await vehicleCol.findOne({
          vehicle_id: data?.vehicle_id,
        });
        if (data) {
          await pub.submitVehicleTopic(data2, data2?.documentStatus);
        }

        newarr.push({
          "Response from vehicle": responsevehicle,
          vehicle_id: data?.vehicle_id,
        });
        bar1.increment(1);
      }

      bar1.stop();
      res.status(200).json({
        status: 200,
        totalDocuments: array.length,
        data: newarr,
      });
    } catch (err) {
      res.status(400).json({
        status: 400,
        error: JSON.stringify(err),
      });
    }
  }
);
router.post(
  "/upload/transfercontracts",
  upload.single("file"),
  async function (req, res) {
    let array;
    if (req.file.mimetype === "text/csv") {
      array = await csv().fromString(req.file.buffer.toString());
    } else {
      throw "Not the file type required";
    }
    var newarr = [];
    var activationCol = await getCollection("activations");
    var vehicleCol = await getCollection("vehicles");
    bar1.start(array?.length, 0);
    for (const data of array) {
      const responsevehicle = await vehicleCol.updateOne(
        { plateNumber: data?.plateNumber },
        {
          $set: {
            contract_uuid_id: data?.contract_uuid_id,
            v1_contract_id: data?.contract_uuid_id,
          },
        }
      );
      const data2 = await vehicleCol.findOne({
        plateNumber: data?.plateNumber,
      });
      const responseActivation = await activationCol.updateOne(
        { vehicle_id: data2?.vehicle_id },
        { $set: { contract_uuid_id: data?.contract_uuid_id } }
      );
      if (data) {
        await pub.submitVehicleTopic(data2, data2?.documentStatus);
      }
      newarr.push({
        "Response from vehicle": responsevehicle,
        plateNumber: data?.plateNumber,
        "Response Activation": responseActivation,
      });
      bar1.increment(1);
    }

    bar1.stop();
    res.status(200).json({
      status: 200,
      totalDocuments: array.length,
      data: newarr,
    });
  }
);

// var { MONGODB } = process.env;
// var client = new import_mongodb.MongoClient(
//   "mongodb+srv://debanil:maxdrive123@london-cluster-vams.wia8y.mongodb.net/test"
// );
var client = new import_mongodb.MongoClient(
  "mongodb+srv://MaxDrive_User2:maxdrive123@london-cluster-vams.xkxgb.mongodb.net/vams?retryWrites=true&w=majority"
);
var cachedDB = null;
var connectToDB = (database) => {
  return new Promise((resolve, reject) => {
    if (cachedDB && cachedDB?.serverConfig?.isConnected()) {
      console.log("cached Database is there");
      resolve(cachedDB);
    }
    client.connect().then((conn) => {
      cachedDB = conn.db(database);
      resolve(cachedDB);
    });
  });
};

var getCollection = function (val) {
  return new Promise(async (resolve, reject) => {
    //   const client2 = await mongo_client_exports;
    const db = await connectToDB("vams");
    const collections = await db.collection(val);
    if (!collections) {
      console.error(`Collection ${val} is not found`);
      reject(`Collection ${val} is not found`);
    }
    resolve(collections);
  });
};
module.exports = router;
