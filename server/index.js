const express = require("express");
const mongoose = require("mongoose")
const cors = require("cors");
const bodyParser = require("body-parser")
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const cookieParser = require("cookie-parser");
const crypto = require('crypto');
const secretKey = crypto.randomBytes(32).toString('hex');
const saltRounds = 10;
const app = express()
const PORT = 3001;


const Register = require("./model/register")


mongoose.connect("mongodb+srv://francesdonz23:password12345@chit-chat.mtvdjuo.mongodb.net/chat-app?retryWrites=true&w=majority", {
  useNewUrlParser: true,
})


app.use(cors(

  {
    origin: ["https://shabu-atif.vercel.app"],
    methods: ["POST", "GET", "DELETE", "PUT"],
    credentials: true
  }

));


app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));


app.post("/registerUser", async(req, res) => {

  
    const full_name = req.body.full_name;
    const email_address = req.body.email_address;
    const password = req.body.password

    console.log(password)
    const hash = await argon2.hash(password);

    const RegisterUser = new Register({

      full_name: full_name,
      email_address: email_address,
      password: hash
      
    })
  
    try {

      await RegisterUser.save();
      console.log("success")
  
    } catch (error) {
  
      console.log(error)
  
  
    }
  
 

})

app.post("/loginUser", async (req, res) => {

  const email_address = req.body.email_address;
  const password = req.body.password;
 

  try {

    const existingUser = await Register.findOne({ email_address });

    if(existingUser) {

      const passwordMatch = await argon2.verify(existingUser.password, password);
      
      if(passwordMatch) {

        const userId = existingUser._id;
         
        const token = jwt.sign({userId} , secretKey, {expiresIn: "1d"});

        res.cookie('token', token, { httpOnly: true, maxAge: 3600000 })

        res.status(200).json({ message: 'Login successful' });

      }  else {

        res.status(401).json({ message: 'Invalid credentials' });

      }
      

    } else {

      res.status(401).json({ message: 'Email not found' });

    }

  } catch (error) {

    console.log(error)

  }

})


const verifyUser = (req, res, next) => {

  const token  = req.cookies.token;

  if(!token) {

    return res.json({ message: 'Unauthorized' });

  } else {

    jwt.verify(token, secretKey, (err, decoded) => {

      if(err) {

        return res.json({message: "Token is not valid"})

      } else {

        req.userId = decoded.userId;
        next()

      }
    })
  }

}

app.get("/LoggedIn", verifyUser, (req, res) => {
  
  return res.json({Message: "Authorized"});

})




app.listen(PORT, () => {

  console.log("server is listening at", PORT)

})
