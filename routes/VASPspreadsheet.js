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

router.get('/', (req, res, next) => {
    try {
    
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



// using puppeteer to mimic my log in onto ecno sharepoint location
async function loginMicrosoftPuppet(isAuth, name) {
  if (isAuth) {
    const downloadPath = path.resolve('./routes/files/spreadsheet/');
    const browser = await puppeteer.launch({ headless: false });
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

  let apps = {
    completedApps: [],
    completedAppsHeaders: [],
    noAssessmentApps: [],
    noAssessmentAppsHeaders: [],
    pendingApps: [],
    pendingAppsHeaders: [],
    progressApps: [],
    progressAppsHeaders: [],
  };

  async function parseXLSX(spreadsheet) {
    const parsed = xlsx.parse(fs.readFileSync(spreadsheet));
    let section = "";
    let data = parsed[0].data;

    let completedApps = [];
    let noAssessmentApps = [];
    let progressApps = [];
    let pendingApps = [];
    
    //console.log(data[0][4]);
    

    // loop through all items in vasp spreadsheet after 13
    for (var j = 0; j < data.length; j++){

      if (section === "completed"){
        completedApps.push(addEmptyColumns(data[j]));
      } else if (section === "noAssessment"){
        noAssessmentApps.push(addEmptyColumns(data[j]));
      } else if (section === "progress"){
        progressApps.push(addEmptyColumns(data[j]));
      } else if (section === "pending"){
        pendingApps.push(addEmptyColumns(data[j]));
      }

      // get headers of completed apps and add subsequent rows to completedApps
      if (data[j][0] === "Completed Apps:  Software Title"){
        apps.completedAppsHeaders = cleanHeaders(data[j]);
        section = "completed";
      } else if (data[j][0] === "No Assessment Completed:  Software Title") {
        apps.noAssessmentHeaders = cleanHeaders(data[j]);
        section = "noAssessment";
      } else if (data[j][0] === "Apps in Progress:  Software Title"){
        apps.progressAppsHeaders = cleanHeaders(data[j]);
        section = "progress";
      } else if (data[j][0]?.toString().includes("Pending List")){
        apps.pendingAppsHeaders = cleanHeaders(data[j]);
        section = "pending";
      } 

    }
    apps.completedApps = completedApps;
    apps.noAssessmentApps = noAssessmentApps;
    apps.progressApps = progressApps;
    apps.pendingApps = pendingApps;

    console.log("VASP apps have been loaded");
  }

  function addEmptyColumns(arr){
    for (var i = 0; i < arr.length; i++){
      if (typeof arr[i] === "undefined"){
        arr[i] = "";
      }
      if (i === 5){
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
