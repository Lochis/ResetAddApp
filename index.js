import AzureHandler from './azureHandler.js';
import formHandler from './formHandler.js';
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';

const app = express()
const port = 3001
const __dirname = path.resolve();

let Applist = {};
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './index.html'));
   new Promise((resolve, reject) => {
    resolve(loadAppList());
   }).then((data) => console.log(data));
})

// inital load of applist data
async function loadAppList(){
  new Promise((resolve, reject) => {
    resolve(AzureHandler());
   }).then((data) => Applist=data)
   return "Loaded Applist";
}

// on submission of form
app.post('/submit-form', (req, res) => {
  const formData = req.body;
  if (formData.status == "Option"){
    console.log("no good");
  }

  if (formData.VASPReport == "Default"){
    console.log("no good");
  }
  //Applist.push(formHandler(formData));
  console.log(formHandler(formData));
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})