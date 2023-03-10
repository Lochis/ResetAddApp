import AzureHandler from './azureHandler.js';
import formHandler from './formHandler.js';
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import $ from 'jquery';
import ejs from 'ejs';

const app = express()
const port = 3001
const __dirname = path.resolve();

let Applist = {};
app.use(bodyParser.urlencoded({extended: false}));
app.set("view engine", "ejs");

app.get('/', (req, res) => {
  loadAppList()
  .then((data) => (Applist=data))
  .then(res.render('index.ejs', res.render('index.ejs', {applist: JSON.stringify(Applist, undefined, 2)})));
})

// inital load of applist data
async function loadAppList(){
  return new Promise((resolve, reject) => {
    resolve(AzureHandler());
   });
}

async function reloadAppList(){
  return new Promise((resolve, reject) => {
    resolve(Applist);
   });
}

// on submission of form
app.post('/submit-form', (req, res) => {
  const formData = req.body;
  if (formData.status == "Option"){
    console.log("no good status option");
  }
  if (formData.VASPReport == "Default"){
    console.log("no good VASPReport option");
  }
  
  // check if Applist is populated, if it is, push formData to Applist
  if (Object.keys(Applist).length > 0){
    Applist.rows.push(formHandler(formData));
    reloadAppList()
    .then(res.render('index.ejs', {applist: JSON.stringify(Applist, undefined, 2)}));
  }
    
  console.log(Applist.rows[Applist.rows.length-1]);
})

//app.get('/json', (req, res) => {
  
//});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})