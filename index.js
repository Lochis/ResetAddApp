import {init, uploadBlob} from './azureHandler.js';
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

app.get('/', async (req, res) => {
  try {
  Applist = await loadAppList();
  res.render('index.ejs', {applist: Applist.rows});
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
})

// inital load of applist data
async function loadAppList(){
  try{
    Applist = await init();
    return Applist;
  } catch (error){
    console.error(error);
  }

}

// on submission of form
app.post('/submit-form', (req, res) => {
  const formData = req.body;
  // check if Applist is populated, if it is, push formData to Applist
  if (Object.keys(Applist).length > 0) {
    if (formData.appName == '' || formData.appLink == '' || formData.desc == '' || formData.VASPLink == '') {
      res.send("Empty values, please input the values");
    } else {

      if (formData.status != "Option" && formData.VASPReport != "Default") {
        Applist.rows.push(formHandler(formData));
        res.render('index.ejs', {
          applist: Applist.rows,
        });
      } else {
        if (formData.status == "Option") {
         res.send("Choose a Status other than default");
        }
        if (formData.VASPReport == "Default") {
          res.send("Choose a VASPReport Option other than default");
        }
      }
    }
  }
})

app.post('/update-azure', async (req, res) => {
  //preventative measure so that file doesn't get erased
  if (Object.keys(Applist).length > 0){
  try {
    await uploadBlob(Applist);
    res.send('/post-action?uploadSuccess')
  } catch (error){
    console.error(error);
    res.send('/post-action?uploadError')
  }
}else {
  res.send("Please reload page, Applist is not updated yet.");
}
})

app.get('/post-action', (req, res) => {
  res.render('index.ejs', {
    applist: Applist.rows,
  });
})

app.post('/delete-app', (req, res) =>{
  const buttonId = req.body.id;
  Applist.rows.splice(buttonId, 1);
  console.log(Applist.rows.length);
  
  res.send('/post-action?deleteSuccess')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})