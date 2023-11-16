const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require("path")
const ejs = require('ejs');
const bodyParser = require("body-parser")

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Farmerpe', { useNewUrlParser: true, useUnifiedTopology: true });

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define a MongoDB schema for storing images
const formDataSchema = new mongoose.Schema({
    fname: String,
    mname: String,
    lname: String,
    email:String,
    district: String,
    address: String,
    landarea: String,
    rnumber:String,
    mnumber:String,
    aadhaar: String,
    pcode: String,
    aname: String, 
    password: String,
    aimg: {
        name: String,
        data: Buffer,
        contentType: String
    },
    cimg: {
        name: String,
        data: Buffer,
        contentType: String
    }
});
const agents = new mongoose.Schema({
  name: String,
  password: String
})

const agentModel = mongoose.model('agent', agents)
const FormData = mongoose.model('animal', formDataSchema);

// Serve static files (images in this case)

app.use( express.static(path.join(__dirname, 'static')));
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({ extended: true }));

const serveHTML = (page) => (req, res) => {

    res.render(path.join(__dirname, "html_files", `${page}`));
    
  };

app.get('/', serveHTML('client_form'));
app.get('/:number', async (req, res)=>{
  const num = req.params.number
  try{
    const user_data = await FormData.findOne({rnumber: num})
    if(user_data){
      res.render(path.join(__dirname, "html_files", `animal_data.ejs`), {user_data});
    }
    else{
       
      res.render(path.join(__dirname, "html_files", `client_form`), {num})
    }
    
  }
  catch{
    console.log("some error occured")
  }
})

app.post('/submit',  upload.fields([{ name: 'aimg', maxCount: 1 }, { name: 'cimg', maxCount: 1 }]), async (req, res) => {
    try {
        const { fname, mname, lname, email, district, address, landarea, rnumber, mnumber, aadhaar,pcode, aname, password } = req.body;
        const agent_data = await agentModel.findOne({name: aname, password: password})
        if(agent_data){
   
            const aimg = req.files['aimg'][0];
            const cimg = req.files['cimg'][0];
          if(aimg && cimg){
            const formData = new FormData({
              fname: fname,
              mname: mname,
              lname: lname,
              email:email,
              district: district,
              address: address,
              landarea: landarea,
              rnumber:rnumber,
              mnumber:mnumber, 
              aadhaar: aadhaar,
              pcode: pcode,
              aname: aname, 
              password: password, 
              aimg: {
                  name: aimg.originalname,
                  data: aimg.buffer,
                  contentType: aimg.mimetype
              },
              cimg: {
                  name: cimg.originalname,
                  data: cimg.buffer,
                  contentType: cimg.mimetype
              }
          });
  
          await formData.save();
          res.send('Form data submitted successfully!');
          }
          else{
            res.send("image not chosen")
          }

        }
        else{
          res.send("Username or password Incorrect")
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/generate',  upload.fields([{ name: 'aimg', maxCount: 1 }, { name: 'cimg', maxCount: 1 }]), async (req, res) => {
  try {
    const { fname, mname, lname, email, district, address, landarea, rnumber, mnumber, aadhaar,pcode, aname, password } = req.body;
    const agent_data = await agentModel.findOne({name: aname, password: password})
    if(agent_data){

        const aimg = req.files['aimg'][0];
        const cimg = req.files['cimg'][0];
      if(aimg && cimg){
        const formData = new FormData({
          fname: fname,
          mname: mname,
          lname: lname,
          email:email,
          district: district,
          address: address,
          landarea: landarea,
          rnumber:rnumber,
          mnumber:mnumber, 
          aadhaar: aadhaar,
          pcode: pcode,
          aname: aname, 
          password: password, 
          aimg: {
              name: aimg.originalname,
              data: aimg.buffer,
              contentType: aimg.mimetype
          },
          cimg: {
              name: cimg.originalname,
              data: cimg.buffer,
              contentType: cimg.mimetype
          }
      });

      await formData.save();
      res.render(path.join(__dirname, "html_files", `recipt.ejs`), {formData});
      }
      else{
        res.send("image not chosen")
      }

    }
    else{
      res.send("Username or password Incorrect")
    }


  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});
// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

