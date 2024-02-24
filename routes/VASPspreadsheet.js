const puppeteer = require ('puppeteer');
const path = require('path');
const express = require('express');
const fs = require('fs');
const zip = require('adm-zip');
const { fileLoader } = require('ejs');
const router = express.Router();


router.get('/', (req, res, next) => {
    try {
    res.render('vaspSpreadsheet', {
        title: 'AMDSB Application Approvals',
        isAuthenticated: req.session.isAuthenticated,
        name: req.session.account?.name,
        });
    } catch(error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/get-spreadsheet', async (req, res) => {
    // using puppeteer to mimic my log in onto ecno sharepoint location
    async function loginMicrosoftPuppet (isAuth, name) {
      if (isAuth) { 
      const downloadPath = path.resolve('./routes/files/spreadsheet/');
      const browser = await puppeteer.launch({headless: false});
      const page = await browser.newPage();
  
      const client = await page.target().createCDPSession()
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        userDataDir: './',
        downloadPath: downloadPath,
      })
  
      const url = "https://ecno.sharepoint.com/sites/VASPDocumentPublication/Shared%20Documents/Forms/AllItems.aspx?FolderCTID=0x01200040DCD9A2FF9E1E42A3EF9EFD2DD260A1&id=%2Fsites%2FVASPDocumentPublication%2FShared%20Documents%2FGeneral%2FAPP%20STATUS%20SPREADSHEET&viewid=22be3505%2D5f01%2D42ae%2D9bae%2D5ba2d20af8c9";
  
      await page.setViewport({width: 1280, height: 800});
      await page.goto(url);
  
      const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle0' });
  
      // type in email
      await page.waitForSelector('#idSIButton9');
      await page.type('#i0116', process.env.SPO_USERNAME);
      // click next button
      await page.click('#idSIButton9');
      console.log("Got to email screen");
  
      await navigationPromise;
  
      // wait and type
      const passwordBoxSelector = '#i0118';
      await page.waitForSelector("#idSIButton9");
      await page.type('#i0118', process.env.SPO_PASSWORD);
      await page.click("#idSIButton9");
      console.log("Got to Password screen");
  
      await navigationPromise;
     
      // click yes button
      const textSelector = await page.waitForSelector('#idSIButton9');
      await page.click("#idSIButton9");
      console.log("Got to Stay Signed in screen");
  
      await navigationPromise;
  
      await page.waitForSelector("button[name='Download']");
      await page.click("button[name='Download']");
      await page.screenshot({ path: 'screenshot.png' });

      setTimeout(() => {
        let strName = name.split(" ");
        strName = strName.join(".");
        console.log(strName);
    
        
      // gets the name of the latest file and renames it to VASP.zip
      const latestFile = getLatestFile('./routes/files/spreadsheet/');
  
      fs.rename(latestFile, './routes/files/spreadsheet/VASP.zip', function (err) {
          if (err) throw err
          console.log('Successfully renamed - AKA moved!')
      });
          
      // Now we can unzip the file and extract contents
      var file = new zip('./routes/files/spreadsheet/VASP.zip');
      file.extractAllTo(/*target path*/ downloadPath, /*overwrite*/ true);
  
      // Get a hold of spreadsheet location! (xlsx)
      const spreadsheetFile = getLatestFile('./routes/files/spreadsheet/APP STATUS SPREADSHEET/');
  
      console.log(spreadsheetFile);
      }, 2000);
  
    
      }
    };

    loginMicrosoftPuppet(req.session.isAuthenticated, req.session.account.name);
  
    res.json({message: "Spreadsheet gotten"});
  });


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