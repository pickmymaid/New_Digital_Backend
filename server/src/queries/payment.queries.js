const { paymentModel } = require('../models/payment/payment.model');
const { getCustomerWithID } = require('./user.queries');
const moment = require('moment');
const xml2js = require('xml2js');
const axios = require('axios');

const url = 'https://secure.3gdirectpay.com/API/v6/';

const generateToken = async (body) => {
  const userID = body?.user_id;
  let ReturnUrl;
  let checkData = await paymentModel.findOne({
    user_id: userID,
    status: { $ne: 2 },
  });

  let Transuser = await getCustomerWithID(userID);
  let ValidtyStatus;

  if (checkData) {
    console.log({checkData});

    const createdAtTime = new Date(checkData.createdAt);
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - createdAtTime.getTime();
    const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));

    if (hoursDifference >= 5) {
      ValidtyStatus = false;
    } else {
      ValidtyStatus = true;
    }
  }

  if (checkData && checkData?.status !== 2 && checkData?.type === body.type && ValidtyStatus) {
    ReturnUrl = `https://secure.3gdirectpay.com/payv2.php?ID=${checkData.transactionToken}`;
    return ReturnUrl;
  }else if(checkData?.status === 1){
   return  'user is Already Subscribed'
  }
  else {

    const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
    <API3G>
      <CompanyToken>${process.env.COMPANY_TOKEN}</CompanyToken>
      <Request>createToken</Request>
      <Transaction>
        <PaymentAmount>${body?.amount}</PaymentAmount>
        <PaymentCurrency>AED</PaymentCurrency>
        <CompanyRef>JBYOFR</CompanyRef>
        <customerEmail>${Transuser && Transuser?.email}</customerEmail>
        <customerFirstName>${Transuser && Transuser?.first_name}</customerFirstName>
        <customerLastName>${Transuser && Transuser?.last_name}</customerLastName>>
        <customerPhone>${Transuser && Transuser?.phone}</customerPhone>
        <RedirectURL>${process.env.REDIRECT_URL}</RedirectURL>
        <BackURL>${process.env.BASE_URL}</BackURL>
        <CompanyRefUnique>0</CompanyRefUnique>
        <PTL>5</PTL>
      </Transaction>
      <Services>
        <Service>
          <ServiceType>${process.env.COMPANY_SERVICE}</ServiceType>
          <ServiceDescription>Subcription Service</ServiceDescription>
          <ServiceDate>${moment().format('yyyy-MM-DD')}</ServiceDate>
        </Service>
      </Services>
    </API3G>`;

    try {
      let pay = await paymentModel.find({ user_id: userID });
      if (pay) {
        pay?.map(async (item) => {
          if (item.status === 0) {
            await paymentModel.deleteOne({ _id: item._id });
          }
        });
      }

      const response = await axios.post(url, xmlPayload, {
        headers: {
          'Content-Type': 'application/xml',
        },
      });

      const parser = new xml2js.Parser();
      const parsedData = await parser.parseStringPromise(response.data);
      console.log(parsedData, 'DATA');
      const transToken = parsedData?.API3G?.TransToken[0];
      const transRef = parsedData?.API3G?.TransRef[0];

      let paymentData = new paymentModel({
        user_id: userID,
        transactionToken: transToken,
        transRef: transRef,
        type: body?.type,
        expiryDate: body?.expiryDate,
      });

      if (transToken) {
        ReturnUrl = `https://secure.3gdirectpay.com/payv2.php?ID=${transToken}`;
      } else {
        ReturnUrl = '';
      }

      await paymentData.save();
      return ReturnUrl;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
};

const verifyToken = async (body) => {
  try {
    const parser = new xml2js.Parser();
    let parsedData;

    let status;
    let Tid = body?.Tid;
    const userID = body?.user_id;
    let verifyToken = (await paymentModel.findOne({
      transactionToken: Tid,
      user_id: userID,
    }));

    if (verifyToken) {
      const xmlpayload = `<?xml version="1.0" encoding="utf-8"?>
    <API3G>
      <CompanyToken>${process.env.COMPANY_TOKEN}</CompanyToken>
      <Request>verifyToken</Request>
      <TransactionToken>${verifyToken?.transactionToken}</TransactionToken>
    </API3G>`;
      const response = await axios.post(url, xmlpayload, {
        headers: {
          'Content-Type': 'application/xml',
        },
      });
      parsedData = await parser.parseStringPromise(response.data);
      console.log(parsedData);
      status = parsedData?.API3G?.Result[0];
      if (status === '000') {
        let updatedDocument = await paymentModel.findOneAndUpdate(
          { user_id: userID },
          { $set: { status: 1 } },
          { new: true }
        );

        return updatedDocument;
      } else {
        return verifyToken;
      }
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getPayments = async (page, limit, search) => {
  try {
    const skip = page && limit ? (page - 1) * limit : 0;

    // Build search condition
    const matchStage = {};
    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      matchStage.$or = [
        { "Customers.first_name": regex },
        { "Customers.email": regex },
        { "Customers.phone": regex },
        { "transRef": regex },
      ];
    }

    const pipeline = [
      {
        $lookup: {
          from: 'customers',
          localField: 'user_id',
          foreignField: 'user_id',
          as: 'Customers',
        },
      },
      {
        $unwind: '$Customers',
      },
    ];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push({
      $project: {
        _id: 1,
        user_id: 1,
        type: 1,
        status: 1,
        transRef: 1,
        expiryDate: 1,
        createdAt: 1,
        updatedAt: '$paymentDate',
        name: '$Customers.first_name',
        email: '$Customers.email',
        mobile: '$Customers.phone',
      },
    });

    pipeline.push({
      $sort: {
        createdAt: -1
      }
    });

    // Clone pipeline for count before pagination
    const countPipeline = [
      {
        $lookup: {
          from: 'customers',
          localField: 'user_id',
          foreignField: 'user_id',
          as: 'Customers',
        },
      },
      {
        $unwind: '$Customers',
      },
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      { $count: "total" }
    ];

    if (page && limit) {
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });
    }

    const [data, countResult] = await Promise.all([
      paymentModel.aggregate(pipeline),
      paymentModel.aggregate(countPipeline)
    ]);

    return {
      data,
      count: countResult?.[0]?.total || 0
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getPaymentsByUserID = async (userID) => {
  try {
    return await paymentModel.findOne(
      { user_id: userID, status :1 },
      { transRef: 1, type: 1, status: 1, expiryDate: 1, updatedAt: 1 }
    );
  } catch (error) {
    throw error;
  }
};

const manualverifyToken = async (body) => {
  try {
    const parser = new xml2js.Parser();
    let parsedData;

    let status;
    let Ref = body?.ref;

    let verifyToken = (await paymentModel.findOne({
      transRef: Ref,
    }));

    if (verifyToken) {
      const xmlpayload = `<?xml version="1.0" encoding="utf-8"?>
    <API3G>
      <CompanyToken>${process.env.COMPANY_TOKEN}</CompanyToken>
      <Request>verifyToken</Request>
      <TransactionToken>${verifyToken?.transactionToken}</TransactionToken>
    </API3G>`;
      const response = await axios.post(url, xmlpayload, {
        headers: {
          'Content-Type': 'application/xml',
        },
      });
      parsedData = await parser.parseStringPromise(response.data);
      console.log(parsedData);
      status = parsedData?.API3G?.Result[0];
      if (status === '000') {
        let updatedDocument = await paymentModel.findOneAndUpdate(
          { transRef: Ref },
          { $set: { status: 1 } },
          { new: true }
        );

        return updatedDocument;
      } else {
        return verifyToken;
      }
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  getPayments,
  getPaymentsByUserID,
  manualverifyToken,
};
