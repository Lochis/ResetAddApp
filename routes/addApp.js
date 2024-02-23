/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require('express');
const https = require('https');
const router = express.Router();
const {init, uploadBlob} = require('../azureHandler.js');
const {pushAppObject} = require('../formHandler.js');
const {Client} = require('@microsoft/microsoft-graph-client');
const puppeteer = require ('puppeteer');
const { text } = require('body-parser');
const fs = require('fs');
const path = require('path');
const { setDefaultAutoSelectFamilyAttemptTimeout } = require('net');

require('dotenv').config();
//var {SPO} = require('../spHandler.js');


var topDeskTickets = '';
var finalMatches = [];

let Applist = {};

 var options = {
    'method': 'GET',
    'headers': {
      'Authorization': process.env.TOPDESK_BASIC_AUTH
    }
  };
  const req = https.request("https://amdsb.topdesk.net/tas/api/incidents?query=category.name==('App Approval Request');processingStatus.name!=('Waiting for Vendor')&pageSize=10", options, (res) => {
  
    res.on('data', (chunk) => {
      topDeskTickets += chunk;
    });
  
    res.on('end', () => {
      try{
        topDeskTickets = JSON.parse(topDeskTickets);

        fs.writeFile('myjsonfile.json', JSON.stringify(topDeskTickets, null, 2), (error) => {
          if (error) {
            console.log("An error has occured ", error);
          }
          else {
            console.log("Data wirtten successfully to disk");
          }
        });
      } catch (e){
        console.error(e);
      }
      
    });
  });
  
  req.end();


  // using puppeteer to mimic my log in onto ecno sharepoint location
  async function loginMicrosoftPuppet (isAuth, name) {

    if (isAuth) { 
    const downloadPath = path.resolve('./routes/files/');
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

    await page.screenshot({ path: 'screenshot.png' });

    await page.waitForSelector("button[name='Download']");
    await page.click("button[name='Download']");
    //await browser.close();


    let strName = name.split(" ");
    strName = strName.join(".");
    console.log(strName);
/*
    // Usage example: Specify the directory path
    const downloadsFolderPath = 'C:\\Users\\' + strName + '\\Downloads';

    setTimeout(() => {
      
      const latestFile = getLatestFile(downloadsFolderPath);
        

      setTimeout(() => {
          fs.rename(latestFile, './files/VASP.zip', function (err) {
            if (err) throw err
            console.log('Successfully renamed - AKA moved!')
          });
    
          if (latestFile) {
            console.log('Latest file:', latestFile);
          } else {
            console.log('No files found in the specified directory.');
          }
      }, 3000);
       
      
    }, 5000);
    */

    }
  };

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


router.get('/', (req, res, next) => {
    try {
    res.render('addApp', {
        title: 'AMDSB Application Approvals',
        inApp: true,
        isAuthenticated: req.session.isAuthenticated,
        name: req.session.account?.name,
        applist: Applist.rows,
        crossRef: finalMatches,
        allTickets: topDeskTickets,
        });

        loginMicrosoftPuppet(req.session.isAuthenticated, req.session.account.name);
    } catch(error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// inital load of applist data
async function loadAppList(){
    try{
      Applist = await init();
      return Applist;
    } catch (error){
      console.error(error);
    }
  
  }

router.post('/load-list', async (req, res)=> {
    Applist = await loadAppList();
    res.json({
        title: 'AMDSB Application Approvals',
        inApp: true,
        isAuthenticated: req.session.isAuthenticated,
        name: req.session.account?.name,
        applist: Applist.rows,
        crossRef: finalMatches,
        allTickets: topDeskTickets,
      });
})

// cross reference topdesk tickets and application approvals to see if there are any matches.
router.post('/cross-ref', async (req, res) => {
  const applistReg = /<a[^>]+>([^<]+)/g;
  const topDeskReg = /Name of the app\r\n- ([^\r]+)/g;
  if(Applist.rows.length < 1){
    Applist = await loadAppList();
  }
  
  let match;
  const applistNames = [];
  const topDeskNames = [];
  finalMatches = [];

  // gather all application names
    // applist
    for (let i = 0; i < Applist.rows.length; i++) {
      const app = Applist.rows[i].Application;
      let match;
    
      while ((match = applistReg.exec(app)) !== null) {
        applistNames.push(match[1]);
      }
    }
    // topdesk
    for (let i = 0; i < topDeskTickets.length; i++) {
      const ticket = topDeskTickets[i].request;
      let match;

    while ((match = topDeskReg.exec(ticket)) !== null) {
      topDeskNames.push(match[1]);
    }
  }

  // now we must test applist data on topdesk data to see if there are any matches

    for(let i = 0; i < topDeskNames.length; i++){
      let topDeskWords = topDeskNames[i].split(' ');
      let firstWord = topDeskWords[0].replace(/"/g, '').trim();
      

        for(let j = 0; j < applistNames.length; j++){
          let applistWords = applistNames[j].split(' ');
          if (applistWords.includes(firstWord)){
            finalMatches.push({TopDesk: topDeskNames[i].replace(/"/g, '').trim(), Applist: applistNames[j]});
          }
      }
    }

    res.json({
      title: 'AMDSB Application Approvals',
      inApp: true,
      isAuthenticated: req.session.isAuthenticated,
      name: req.session.account?.name,
      applist: Applist.rows,
      crossRef: finalMatches,
      allTickets: topDeskTickets,
      });
})

router.post('/submit-form', (req, res)=> {
    const formData = req.body;
  // check if Applist is populated, if it is, push formData to Applist
  if (Object.keys(Applist).length > 0) {
    if (formData.appName == '' || formData.appLink == '' || formData.desc == '' || formData.VASPLink == '') {
      res.send("Empty values, please input the values");
    } else {

      if (formData.status != "Option" && formData.VASPReport != "Default") {
        Applist.rows.unshift(pushAppObject(formData));
        console.log(Applist.rows[Applist.rows.length-1])
        res.redirect("/addApp");
        /*res.json({
          title: 'AMDSB Application Approvals',
          inApp: true,
          isAuthenticated: req.session.isAuthenticated,
          name: req.session.account?.name,
          applist: Applist.rows,
          crossRef: finalMatches,
          allTickets: topDeskTickets,
          });*/
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

router.post('/update-azure', async (req, res) => {
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
  
  router.get('/post-action', (req, res) => {
    res.json({
      title: 'AMDSB Application Approvals',
      inApp: true,
      isAuthenticated: req.session.isAuthenticated,
      name: req.session.account?.name,
      applist: Applist.rows,
      crossRef: finalMatches,
      allTickets: topDeskTickets,
      });
  })
  
  router.post('/delete-app', (req, res) =>{
    const buttonId = req.body.id;
    Applist.rows.splice(buttonId, 1);
    console.log(Applist.rows.length);
    
    res.json({
      title: 'AMDSB Application Approvals',
      inApp: true,
      isAuthenticated: req.session.isAuthenticated,
      name: req.session.account?.name,
      applist: Applist.rows,
      crossRef: finalMatches,
      allTickets: topDeskTickets,
      });
  })

module.exports = router;
