"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _express = _interopRequireWildcard(require("express"));

var _cors = _interopRequireDefault(require("cors"));

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

var _crypto = require("crypto");

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

require("dotenv").config();

//Refer : Twilio usage with Nodejs official documentation
var accountSid = process.env.ACCOUNT_SID;
var authToken = process.env.AUTH_TOKEN;

var client = require("twilio")(accountSid, authToken);

var smsKey = process.env.SMS_SECRET_KEY;
var twilioNum = process.env.TWILIO_PHONE_NUMBER;
var JWT_AUTH_TOKEN = process.env.JWT_AUTH_TOKEN;
var JWT_REFRESH_TOKEN = process.env.JWT_REFRESH_TOKEN;
var refreshTokens = [];
var app = (0, _express["default"])();
app.use((0, _express.json)());
app.use((0, _cors["default"])({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use((0, _cookieParser["default"])());
app.post("/sendOTP", function (req, res) {
  //process '/sentOTP' route
  var phone = req.body.phone;
  var otp = Math.floor(100000 + Math.random() * 900000); //6dig random no. gen

  var ttl = 2 * 60 * 1000; //time to live for otp

  var expires = Date.now() + ttl; //expiry time for otp

  var data = "".concat(phone, ".").concat(otp, ".").concat(expires); //concat string having all needed data

  var hash = (0, _crypto.createHmac)("sha256", smsKey).update(data).digest("hex"); //calculate hash with privateKey = smsKey

  var fullHash = "".concat(hash, ".").concat(expires); //append expires for data processing

  client.messages //otp msg - Twilio Docs
  .create({
    body: "<#> Your sar0603@github verification code: ".concat(otp),
    //formatted so modern sms clients can identify sms as otp
    from: twilioNum,
    to: phone
  }) //schedules an async promise
  .then(function (messages) {
    return console.log(messages);
  }) //promise resolved
  ["catch"](function (err) {
    return console.error(err);
  }); //promise error piped to err stream
  // res.status(200).send({ phone, hash: fullHash, otp });  // this bypass otp via api only for development instead hitting twilio api all the time

  res.status(200).send({
    phone: phone,
    hash: fullHash
  }); // Use this way in Production
});
app.post("/verifyOTP", function (req, res) {
  //process '/verifyOTP' route
  var phone = req.body.phone;
  var hash = req.body.hash;
  var otp = req.body.otp;

  var _hash$split = hash.split("."),
      _hash$split2 = _slicedToArray(_hash$split, 2),
      hashValue = _hash$split2[0],
      expires = _hash$split2[1]; //destructuring data vars


  var now = Date.now(); //curr Time

  if (now > parseInt(expires)) {
    //message expired
    return res.status(504).send({
      msg: "Too late ! Try again."
    }); //status code : 504 (timeout)
  }

  var data = "".concat(phone, ".").concat(otp, ".").concat(expires); //The original request string

  var newCalculatedHash = (0, _crypto.createHmac)("sha256", smsKey).update(data).digest("hex");

  if (newCalculatedHash === hashValue) {
    //hash(s) match ! user verified !
    console.log("user confirmed"); //creates jwt tokens seeded with privateKey=JWT_AUTH_TOKEN

    var accessToken = _jsonwebtoken["default"].sign({
      data: phone
    }, JWT_AUTH_TOKEN, {
      expiresIn: "30s"
    });

    var refreshToken = _jsonwebtoken["default"].sign({
      data: phone
    }, JWT_REFRESH_TOKEN, {
      expiresIn: "1y"
    });

    refreshTokens.push(refreshToken);
    res.status(202) //status : Accepted
    .cookie("accessToken", accessToken, {
      //generate access cookie
      expires: new Date(new Date().getTime() + 30 * 1000),
      //30s
      sameSite: "strict",
      httpOnly: true
    }).cookie("refreshToken", refreshToken, {
      //generate refresh cookie
      expires: new Date(new Date().getTime() + 31557600000),
      sameSite: "strict",
      httpOnly: true
    }) //since frontend cannot access our secured cookies
    //we created this dummy cookie to just check presence and expiry
    .cookie("authSession", true, {
      expires: new Date(new Date().getTime() + 30 * 1000),
      sameSite: "strict"
    }).cookie("refreshTokenID", true, {
      expires: new Date(new Date().getTime() + 31557600000),
      //1yr
      sameSite: "strict"
    }).send({
      msg: "Device verified"
    });
  } else {
    console.log("not authenticated");
    return res.status(400).send({
      verification: false,
      msg: "Incorrect OTP"
    }); //Status : bad req
  }
});
app.post("/home", authenticateUser, function (req, res) {
  console.log("home private route");
  res.status(202).send("Private Protected Route - Home");
});

function authenticateUser(req, res, next) {
  var accessToken;
  return regeneratorRuntime.async(function authenticateUser$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          accessToken = req.cookies.accessToken;

          _jsonwebtoken["default"].verify(accessToken, JWT_AUTH_TOKEN, function _callee(err, phone) {
            return regeneratorRuntime.async(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (!phone) {
                      _context.next = 5;
                      break;
                    }

                    //If verified then phone parameter wont be false value
                    req.phone = phone; //send phone in the request

                    next(); //generate next action

                    _context.next = 11;
                    break;

                  case 5:
                    if (!(err.message === "TokenExpiredError")) {
                      _context.next = 9;
                      break;
                    }

                    return _context.abrupt("return", res.status(403).send({
                      //send req->status : forbidden
                      success: false,
                      msg: "Access token expired"
                    }));

                  case 9:
                    //token incorrect
                    console.log(err);
                    return _context.abrupt("return", res.status(403).send({
                      err: err,
                      msg: "User not authenticated"
                    }));

                  case 11:
                  case "end":
                    return _context.stop();
                }
              }
            });
          });

        case 2:
        case "end":
          return _context2.stop();
      }
    }
  });
}

app.post("/refresh", function (req, res) {
  var refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(403).send({
    message: "Refresh token not found, login again"
  });
  if (!refreshTokens.includes(refreshToken)) return res.status(403).send({
    message: "Refresh token blocked, login again"
  });

  _jsonwebtoken["default"].verify(refreshToken, JWT_REFRESH_TOKEN, function (err, phone) {
    if (!err) {
      var accessToken = _jsonwebtoken["default"].sign({
        data: phone
      }, JWT_AUTH_TOKEN, {
        expiresIn: "30s"
      });

      return res.status(200).cookie("accessToken", accessToken, {
        expires: new Date(new Date().getTime() + 30 * 1000),
        sameSite: "strict",
        httpOnly: true
      }).cookie("authSession", true, {
        expires: new Date(new Date().getTime() + 30 * 1000),
        sameSite: "strict"
      }).send({
        previousSessionExpired: true,
        success: true
      });
    } else {
      return res.status(403).send({
        success: false,
        msg: "Invalid refresh token"
      });
    }
  });
});
app.get("/logout", function (req, res) {
  //destroy all cookies
  res.clearCookie("refreshToken").clearCookie("accessToken").clearCookie("authSession").clearCookie("refreshTokenID").send("logout");
});
app.listen(process.env.PORT || 8888);