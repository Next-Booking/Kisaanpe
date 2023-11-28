// Import required modules
const express = require("express");
const qr = require("qrcode");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");

const qrHandler = require('./static/script/qr-handler');
const session = require("express-session")


// Create Express application
const app = express();
const port = 3000;
const numberRegex = /^\d+$/;


// Set up middleware
app.use(express.static(path.join(__dirname, "static")));
app.use(express.urlencoded({extended: true}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/js', express.static(__dirname + '/js'));
app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true
}));
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
const animalSchema = new mongoose.Schema({
  mnumber: String,
  atype : String, 
  rnumber: String,
  aname: String,
  aimg:{
    name: String,
    data: Buffer,
    contentType: String,
  },
});
const agents = new mongoose.Schema({
  name: String,
  password: String,
});

const agentModel = mongoose.model("agent", agents);
const FormData = mongoose.model("users", formDataSchema);
const animalData = mongoose.model("animal", animalSchema)
// Serve static files (images in this case)

const serveHTML = (page ,req, res) =>  {
  res.render(path.join(__dirname, "html_files", `${page}`));
};

// Define GET routes
app.get("/", (req, res) => {
  const user = req.session.user
  if(user){
    serveHTML("home_page_dash.ejs", req, res)
  }
  else{
    serveHTML("home_page.ejs", req, res)
  }
  
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




app.get("/register-animal",(req, res)=>{
  user = req.session.user;
  if(user){
    serveHTML("scan.ejs", req, res)
  }
  else{
    res.redirect("/login")
  }
})

app.get("/dashboard", async (req, res)=>{
  const user = req.session.user;

  if(user){
    const rdata = await FormData.findOne({mnumber: user.mnumber})
    const adata = await animalData.find({mnumber: user.mnumber})
    res.render(path.join(__dirname, "html_files", `dashboard.ejs`), {rdata, adata});
  }
  else{
    serveHTML("login.ejs", req, res)
  }
})




app.get("/:number", async (req, res) => {
  const num = req.params.number;
  const user = req.session.user
  if(num.match(numberRegex)){

    try {
        const animal_data = await animalData.findOne({ rnumber: num });
        if(animal_data){
          const owner_data = await FormData.findOne({mnumber: animal_data.mnumber })
         
          res.render(path.join(__dirname, "html_files", `animal_data.ejs`), {
            animal_data, owner_data
          });
        }
        else if(user){
          res.render(path.join(__dirname, "html_files", `animal_registration.ejs`), { num });
        }
        else{
         res.redirect("/login")
        }

    } catch(error) {
      console.log("some error occured");
      console.log(error)
    }
  }
  else{
    res.send("Invalid Request")
  }

});




// Define POST routes
app.post(
  "/register",
  upload.fields([
    { name: "uimg", maxCount: 1 },
    
  ]),
  async (req, res) => {
    try {

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
          res.redirect("/login")
        } else {
          res.send("image not chosen");
        }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.post("/register-animal",  
upload.fields([
  { name: "aimg", maxCount: 1 },
  
]), async (req, res)=>{
  const user = req.session.user
  const {animalType , rnumber, aname, password} = req.body
  const aimg = req.files["aimg"][0];
  const agent = await agentModel.findOne({name : aname, password: password})

  if(aimg){
    if(agent){
      const inputAnimalData = new animalData({
        mnumber : user.mnumber,
        atype : animalType, 
        rnumber: rnumber,
        aname: aname,
        aimg: {
          name : aimg.originalname,
          data: aimg.buffer,
          contentType: aimg.mimetype,
        },
      })
      await inputAnimalData.save()
      serveHTML("registration-success.ejs", req, res)
    }
    else{
      res.send("Agent name or password is incorect")
    }

  }
  else{
    res.send("Image not chosen")
  }
}

)

app.post("/login", async (req, res) => {
  try {

    const { number, password } = req.body;

    const registration = await FormData.findOne({ mnumber: number, password: password });

    if (registration) {
      req.session.user = registration
      res.redirect('/dashboard')  
      
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
