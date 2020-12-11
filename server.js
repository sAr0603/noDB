require("dotenv").config();
import express, { json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

//Refer : Twilio usage with Nodejs official documentation
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

import { createHmac } from "crypto";
const smsKey = process.env.SMS_SECRET_KEY;
const twilioNum = process.env.TWILIO_PHONE_NUMBER;

import jwt from "jsonwebtoken";

const JWT_AUTH_TOKEN = process.env.JWT_AUTH_TOKEN;
const JWT_REFRESH_TOKEN = process.env.JWT_REFRESH_TOKEN;
let refreshTokens = [];

const app = express();
app.use(json());

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());

app.post("/sendOTP", (req, res) => {
  //process '/sentOTP' route
  const phone = req.body.phone;
  const otp = Math.floor(100000 + Math.random() * 900000); //6dig random no. gen
  const ttl = 2 * 60 * 1000; //time to live for otp
  const expires = Date.now() + ttl; //expiry time for otp
  const data = `${phone}.${otp}.${expires}`; //concat string having all needed data
  const hash = createHmac("sha256", smsKey).update(data).digest("hex"); //calculate hash with privateKey = smsKey
  const fullHash = `${hash}.${expires}`; //append expires for data processing

  client.messages //otp msg - Twilio Docs
    .create({
      body: `<#> Your sar0603@github verification code: ${otp}`, //formatted so modern sms clients can identify sms as otp
      from: twilioNum,
      to: phone,
    }) //schedules an async promise
    .then((messages) => console.log(messages)) //promise resolved
    .catch((err) => console.error(err)); //promise error piped to err stream

  // res.status(200).send({ phone, hash: fullHash, otp });  // this bypass otp via api only for development instead hitting twilio api all the time
  res.status(200).send({ phone, hash: fullHash }); // Use this way in Production
});

app.post("/verifyOTP", (req, res) => {
  //process '/verifyOTP' route
  const phone = req.body.phone;
  const hash = req.body.hash;
  const otp = req.body.otp;
  let [hashValue, expires] = hash.split("."); //destructuring data vars

  let now = Date.now(); //curr Time

  if (now > parseInt(expires)) {
    //message expired
    return res.status(504).send({ msg: "Too late ! Try again." }); //status code : 504 (timeout)
  }

  let data = `${phone}.${otp}.${expires}`; //The original request string
  let newCalculatedHash = createHmac("sha256", smsKey)
    .update(data)
    .digest("hex");
  if (newCalculatedHash === hashValue) {
    //hash(s) match ! user verified !
    console.log("user confirmed");

    //creates jwt tokens seeded with privateKey=JWT_AUTH_TOKEN
    const accessToken = jwt.sign({ data: phone }, JWT_AUTH_TOKEN, {
      expiresIn: "30s",
    });
    const refreshToken = jwt.sign({ data: phone }, JWT_REFRESH_TOKEN, {
      expiresIn: "1y",
    });

    refreshTokens.push(refreshToken);
    res
      .status(202) //status : Accepted
      .cookie("accessToken", accessToken, {
        //generate access cookie
        expires: new Date(new Date().getTime() + 30 * 1000), //30s
        sameSite: "strict",
        httpOnly: true,
      })
      .cookie("refreshToken", refreshToken, {
        //generate refresh cookie
        expires: new Date(new Date().getTime() + 31557600000),
        sameSite: "strict",
        httpOnly: true,
      })
      //since frontend cannot access our secured cookies
      //we created this dummy cookie to just check presence and expiry
      .cookie("authSession", true, {
        expires: new Date(new Date().getTime() + 30 * 1000),
        sameSite: "strict",
      })
      .cookie("refreshTokenID", true, {
        expires: new Date(new Date().getTime() + 31557600000), //1yr
        sameSite: "strict",
      })
      .send({ msg: "Device verified" });
  } else {
    console.log("not authenticated");
    return res.status(400).send({ verification: false, msg: "Incorrect OTP" }); //Status : bad req
  }
});

app.post("/home", authenticateUser, (req, res) => {
  console.log("home private route");
  res.status(202).send("Private Protected Route - Home");
});

async function authenticateUser(req, res, next) {
  const accessToken = req.cookies.accessToken;

  jwt.verify(accessToken, JWT_AUTH_TOKEN, async (err, phone) => {
    //verifies jwt tokens with help of privateKey=JWT_AUTH_TOKEN
    if (phone) {
      //If verified then phone parameter wont be false value
      req.phone = phone; //send phone in the request
      next(); //generate next action
    } else if (err.message === "TokenExpiredError") {
      //token correct but expired
      return res.status(403).send({
        //send req->status : forbidden
        success: false,
        msg: "Access token expired",
      });
    } else {
      //token incorrect
      console.log(err);
      return res.status(403).send({ err, msg: "User not authenticated" }); //send req->status : forbidden
    }
  });
}

app.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res
      .status(403)
      .send({ message: "Refresh token not found, login again" });

  if (!refreshTokens.includes(refreshToken))
    return res
      .status(403)
      .send({ message: "Refresh token blocked, login again" });

  jwt.verify(refreshToken, JWT_REFRESH_TOKEN, (err, phone) => {
    if (!err) {
      const accessToken = jwt.sign({ data: phone }, JWT_AUTH_TOKEN, {
        expiresIn: "30s",
      });
      return res
        .status(200)
        .cookie("accessToken", accessToken, {
          expires: new Date(new Date().getTime() + 30 * 1000),
          sameSite: "strict",
          httpOnly: true,
        })
        .cookie("authSession", true, {
          expires: new Date(new Date().getTime() + 30 * 1000),
          sameSite: "strict",
        })
        .send({ previousSessionExpired: true, success: true });
    } else {
      return res.status(403).send({
        success: false,
        msg: "Invalid refresh token",
      });
    }
  });
});

app.get("/logout", (req, res) => {//destroy all cookies
  res
    .clearCookie("refreshToken")
    .clearCookie("accessToken")
    .clearCookie("authSession")
    .clearCookie("refreshTokenID")
    .send("logout");
});
app.listen(process.env.PORT || 8888);
