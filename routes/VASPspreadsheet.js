const puppeteer = require ('puppeteer');
const path = require('path');
const express = require('express');
const fs = require('fs');
const zip = require('adm-zip');
const { fileLoader } = require('ejs');
const xlsx = require('node-xlsx');
const {promisify} = require('util');
const router = express.Router();

const rename = promisify(fs.rename);
const extractAllTo = promisify(new zip().extractAllTo);

let apps = {
    headers: [],
    apps: [],
};

router.get('/', (req, res, next) => {
    try {
    
    /*let spreadsheet = getLatestFile('./routes/files/spreadsheet/APP STATUS SPREADSHEET/');
    if (typeof(spreadsheet) !== undefined){
        parseXLSX(spreadsheet);   
    }*/

    res.render('vaspSpreadsheet', {
        title: 'AMDSB Application Approvals',
        isAuthenticated: req.session.isAuthenticated,
        name: req.session.account?.name,
        apps: apps,
    });

    } catch(error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

    });

router.post('/get-spreadsheet', async (req, res) => {
   //D:/Repos/RESETADDAPP/routes/files/spreadsheet\APP STATUS SPREADSHEET/VASP APP REQUEST STATUS Feb 29 2024.xlsx
  //await parseXLSX('D:/Repos/RESETADDAPP/routes/files/spreadsheet/APP STATUS SPREADSHEET/VASP APP REQUEST STATUS Feb 29 2024.xlsx')    

    await loginMicrosoftPuppet(req.session.isAuthenticated, req.session.account.name);
    await processFiles();

   res.redirect('/vaspSpreadsheet');
});

router.get('/get-apps', (req, res) => {
     try {
         let spreadsheet = getLatestFile('./routes/files/spreadsheet/APP STATUS SPREADSHEET/');
        parseXLSX(spreadsheet);   
     } catch (error){
         console.log("spreadsheet not gotten from VASP");
     }

    res.json({data: apps.apps});
});


// using puppeteer to mimic my log in onto ecno sharepoint location
async function loginMicrosoftPuppet(isAuth, name) {
  if (isAuth) {
    const downloadPath = path.resolve('./routes/files/spreadsheet/');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const client = await page.target().createCDPSession()
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      userDataDir: './',
      downloadPath: downloadPath,
    })

    const url = "https://ecno.sharepoint.com/sites/VASPDocumentPublication/Shared%20Documents/Forms/AllItems.aspx?FolderCTID=0x01200040DCD9A2FF9E1E42A3EF9EFD2DD260A1&id=%2Fsites%2FVASPDocumentPublication%2FShared%20Documents%2FGeneral%2FAPP%20STATUS%20SPREADSHEET&viewid=22be3505%2D5f01%2D42ae%2D9bae%2D5ba2d20af8c9";

    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url);

    const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle0' });

    // type in email
    await page.waitForSelector('#idSIButton9');
    await page.type('#i0116', process.env.SPO_USERNAME);
    // click next button
    await page.click('#idSIButton9');
    console.log("Got to email screen");

   await navigationPromise

    // wait and type
    const passwordBoxSelector = '#i0118';
    await page.waitForSelector("#idSIButton9");
    await page.type('#i0118', process.env.SPO_PASSWORD);
    await page.click("#idSIButton9");
    console.log("Got to Password screen");

   // await navigationPromise

    // click yes button
    const textSelector = await page.waitForSelector('#idSIButton9');
    await page.click("#idSIButton9");
    console.log("Got to Stay Signed in screen");
    
    await navigationPromise;

    await page.waitForSelector("button[name='Download']");
    await page.click("button[name='Download']");
    await page.screenshot({ path: 'screenshot.png' });

    let strName = name.split(" ");
    strName = strName.join(".");
    console.log(strName);
    
  }
};

async function processFiles(){
  setTimeout(() => {
      // gets the name of the latest file and renames it to VASP.zip
    const latestFile = getLatestFile('./routes/files/spreadsheet/');

    fs.renameSync(latestFile, './routes/files/spreadsheet/VASP.zip');
    console.log('Successfully renamed - AKA moved!') 

    // Now we can unzip the file and extract contents
    var file = new zip('./routes/files/spreadsheet/VASP.zip');
    file.extractAllTo('./routes/files/spreadsheet/', /*overwrite*/ true);
    console.log('Successfully unzipped file')

     // Return the spreadsheet location! (xlsx)
    const spreadsheetFile = getLatestFile('./routes/files/spreadsheet/APP STATUS SPREADSHEET/');
     
    console.log(spreadsheetFile);

    parseXLSX(spreadsheetFile);
  }, 4000);
}


  async function parseXLSX(spreadsheet) {
    const parsed = xlsx.parse(fs.readFileSync(spreadsheet));
    let section = "";
    let data = parsed[0].data; 

    // loop through all items in vasp spreadsheet after 13
    for (var j = 0; j < data.length; j++){

    // flag - true means don't process row, false means process row
    let flag = true;
    let row = data[j];
    
        if (section === "completed"){
                row.unshift("Completed");
                apps.apps.push(addEmptyColumns(row));
      } else if (section === "noAssessment"){
             row.unshift("No Assessment");
            apps.apps.push(addEmptyColumns(row));
      } else if (section === "progress"){
            row.unshift("In Progress");
            apps.apps.push(addEmptyColumns(row));
      } else if (section === "pending"){
            row.unshift("Pending");
            apps.apps.push(addEmptyColumns(row));
      }

      // get headers of completed apps and add subsequent rows to completedApps
      if (row[0] === "Completed Apps:  Software Title"){
            row.shift();
            row.unshift("Software Title");
            row.unshift("Type");

            apps.headers = cleanHeaders(row);
            section = "completed";
      } else if (row[1] === "No Assessment Completed:  Software Title") {
          section = "noAssessment";
      } else if (row[1] === "Apps in Progress:  Software Title"){
          section = "progress";
      } else if (row[1]?.toString().includes("Pending List")){
          section = "pending";
      } 

    }

    console.log("VASP apps have been loaded");
  }

  function addEmptyColumns(arr){
    for (var i = 0; i < 12; i++){
      if (typeof arr[i] === "undefined"){
        arr[i] = "";
      }
      if (i === 6){
        arr[i] = parseInt((parseFloat(arr[i]) * 100)).toString() + "%";
      }
    }
    return arr;
  }

  function cleanHeaders(arr){
    for (var i = 0; i < arr.length; i++){
        arr[i] = arr[i].replace(/(r\n|\n|\r)/gm, " ");
        if (arr[i].toString().includes("Platform")){
            arr[i] = "Platform";
        }
        if (arr[i].toString().includes("Language")){
          arr[i] = "Language(s)";
        }
        if (arr[i].toString().includes("Vendor")){
            arr[i] = "Creator";
        }
    }
    return arr;
  }



  function getLatestFile(directoryPath) {
    const files = fs.readdirSync(directoryPath);
  
    if (files.length === 0) {
      console.error('Directory is empty.');
      return null;
    }
  
    // Get the full paths of the files
    const filePaths = files.map(file => path.join(directoryPath, file));
  
    // Sort the files by modification time in descending order
    const sortedFiles = filePaths.sort((a, b) => {
      const statA = fs.statSync(a);
      const statB = fs.statSync(b);
      return statB.mtime.getTime() - statA.mtime.getTime();
    });
  
    // Return the path of the latest file
    return sortedFiles[0];
  }

  module.exports = router;
