// Import required modules
const express = require("express");
const qr = require("qrcode");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');
const qrHandler = require('./static/script/qr-handler');



// Create Express application
const app = express();
const port = 3000;



// Set up middleware
app.use(express.static(path.join(__dirname, "static")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/js', express.static(__dirname + '/js'));

app.set("view engine", "ejs");



// Database connection
mongoose
  .connect("mongodb://localhost:27017/Farmerpe")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });



// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


//Defineing  

// Define a MongoDB schema for storing images
const formDataSchema = new mongoose.Schema({
  fname: String,
  mname: String,
  lname: String,
  email: String,
  district: String,
  address: String,
  mnumber: String,
  aadhaar: String,
  pcode: String,
  larea: String,
  password: String,
  uimg: {
    name: String,
    data: Buffer,
    contentType: String,
  },
});

// const agents = new mongoose.Schema({
//   name: String,
//   password: String,
// });

// const agentModel = mongoose.model("agent", agents);
const FormData = mongoose.model("users", formDataSchema);

// Serve static files (images in this case)

const serveHTML = (page ,req, res) =>  {
  res.render(path.join(__dirname, "html_files", `${page}`));
};

// Define GET routes
app.get("/", (req, res) => {
  // Render the home page with the QR code scanner
  serveHTML("home_page.ejs", req, res)
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    } else {
      serveHTML("login.ejs", req, res)
    }
  });
});

app.get("/login", (req, res) => {
  serveHTML("login.ejs", req, res)
});

app.get("/register", (req, res) => {
  serveHTML("register.ejs", req, res)
});

app.get('/scan', (req, res) => {
  serveHTML("scan.ejs", req, res)
});


// app.get("/:number", async (req, res) => {
//   const num = req.params.number;
//   try {
//     const user_data = await FormData.findOne({ rnumber: num });
//     if (user_data) {
//       res.render(path.join(__dirname, "html_files", `animal_data.ejs`), {
//         user_data,
//       });
//     } else {
//       res.render(path.join(__dirname, "html_files", `client_form`), { num });
//     }
//   } catch {
//     console.log("some error occured");
//   }
// });
app.get("/dashboard", (req, res)=>{
  console.log(req.body)
  serveHTML("dashboard.ejs", req, res)
})


// Define POST routes
app.post(
  "/register",
  upload.fields([
    { name: "uimg", maxCount: 1 },
    
  ]),
  async (req, res) => {
    try {
      console.log(req.body)
      const {
        firstName,
        middleName,
        lastName,
        email,
        district,
        address,
        mobileNumber,
        aadharNumber,
        pinCode,
        localArea,
        Password,
      } = req.body;

        const uimg = req.files["uimg"][0];
        if (uimg) {
          const formData = new FormData({
            fname: firstName,
            mname: middleName,
            lname: lastName,
            email: email,
            district: district,
            address: address,
            mnumber: mobileNumber,
            aadhaar: aadharNumber,
            pcode: pinCode,
            larea: localArea,
            password: Password,
            uimg: {
              name: uimg.originalname,
              data: uimg.buffer,
              contentType: uimg.mimetype,
            },
          });

          await formData.save();
          res.send("Form data submitted successfully!");
        } else {
          res.send("image not chosen");
        }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);


app.post("/login", async (req, res) => {
  try {
    console.log(req.body)
    const { number, password } = req.body;
    console.log(number, password)
    const registration = await FormData.findOne({ mnumber: number, password: password });
    console.log(registration)
    if (registration) {
      const token = jwt.sign(
        {
          _id: registration._id,
          firstName: registration.fname,
          middleName: registration.mname,
          lastName: registration.lname,
          mobileNumber: registration.mnumber,
          email: registration.email,
          district: registration.district,
          address: registration.address,
          aadhaar : registration.aadhaar,
          pcode: registration.pcode,

        },
        'your-secret-key'
      );
        
      
    } else {
      res.status(401).json({ message: 'Invalid phone number or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});




app.post(
  "/generate",
  upload.fields([
    { name: "aimg", maxCount: 1 },
    { name: "cimg", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        fname,
        mname,
        lname,
        email,
        district,
        address,
        landarea,
        rnumber,
        mnumber,
        aadhaar,
        pcode,
        aname,
        password,
      } = req.body;
      const agent_data = await agentModel.findOne({
        name: aname,
        password: password,
      });
      if (agent_data) {
        const aimg = req.files["aimg"][0];
        const cimg = req.files["cimg"][0];
        if (aimg && cimg) {
          const formData = new FormData({
            fname: fname,
            mname: mname,
            lname: lname,
            email: email,
            district: district,
            address: address,
            landarea: landarea,
            rnumber: rnumber,
            mnumber: mnumber,
            aadhaar: aadhaar,
            pcode: pcode,
            aname: aname,
            password: password,
            aimg: {
              name: aimg.originalname,
              data: aimg.buffer,
              contentType: aimg.mimetype,
            },
            cimg: {
              name: cimg.originalname,
              data: cimg.buffer,
              contentType: cimg.mimetype,
            },
          });

          await formData.save();
          res.render(path.join(__dirname, "html_files", `recipt.ejs`), {
            formData,
          });
        } else {
          res.send("image not chosen");
        }
      } else {
        res.send("Username or password Incorrect");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
