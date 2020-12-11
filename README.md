<p align="center">
  <img src="./client/src/img/noDB.png" width="120">
</p>

 ![Made with JS](https://img.shields.io/badge/Made%20with-js-blueviolet?style=for-the-badge&logo=js)  ![Open Source Love](https://img.shields.io/badge/Open%20Source-%E2%99%A5-red?style=for-the-badge&logo=open-source-initiative)  ![Built with Love](https://img.shields.io/badge/Built%20With-%E2%99%A5-critical?style=for-the-badge&logo=ko-fi)

##  Trivia 
Cryptographic Hashing Algorithm used : sha256 

Libraries used : webpack,express,react,axios,jwt,cors,crypto,twilio.


##  About
noDB is an implementation of passwordless authentication of user.

Achieved without using any dB,promoting horizontal scalability.
This is achieved by using the power of ```JWT(Json Web Tokens)```.

Built using ```express.js``` for server,
```React``` for frontend.

Used Twilio API for realtime OTP verification.

##  Architecture 
<h3>Overall<h1>
<p align="center">
  <img src="./client/src/img/architecture1.png" width="1000">
</p>
<h3>Server<h1>
<p align="center">
  <img src="./client/src/img/architecture2.png" width="1000">
</p>

</p>
<h3>HashToken<h1>
<p align="center">
  <img src="./client/src/img/architecture3.png" width="800">
</p>
</p>

<h3>JWT<h1>
<p align="center">
  <img src="./client/src/img/architecture4.jpeg" width="800">
</p>


##  Usage
<h3>Homepage<h1>
<p align="center">
  <img src="./client/src/img/home.png" width="700">
</p>
<h3>Verification<h1>
<p align="center">
  <img src="./client/src/img/verify.png" width="700">
</p>

</p>
<h3>Logged In/Protected Route<h1>
<p align="center">
  <img src="./client/src/img/lin.png" width="700">
</p>



###  Installation
- Install node dependencies & set your 64bit cryptographic  keys and Twilio API-key in .env variable.

```bash
$ npm install
$ npm audit fix
```


### Commands
- Start project using node-server
```bash
$ cd ./src
$ npm install
$ npm start
```

## Resources

- [JWT](https://jwt.io/)
- [Twilio Nodejs Docs](https://www.twilio.com/docs/sms/quickstart/node)


##  License
[![License](https://img.shields.io/github/license/code-monk08/metroworks?style=for-the-badge)](https://github.com/code-monk08/metroworks/blob/master/LICENSE)

# noDB
