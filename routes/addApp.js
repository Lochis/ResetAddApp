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
  const req = https.request("https://amdsb.topdesk.net/tas/api/incidents?query=category.name==('App Approval Request');processingStatus.name!=('Waiting for Vendor')&pageSize=400", options, (res) => {
  
    res.on('data', (chunk) => {
      topDeskTickets += chunk;
    });
  
    res.on('end', () => {
      try{
        topDeskTickets = JSON.parse(topDeskTickets);
      } catch (e){
        console.error(e);
      }
      
    });
  });
  
  req.end();

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
    } catch(error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

async function test(req){
  try{
  const graphClient = Client.init({
    authProvider: (done) => {
      done(null, req.session.accessToken);
    }
  });

  //const channels = await graphClient.api('/teams/854fbd34-2554-4da6-8974-9aff2a09eaf0/channels')
  const channels = await graphClient.api('/me/joinedTeams')
  //.expand('channels')
  .get();

  console.log(channels);
}catch(err) {
  console.error(err);
}
}

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
        res.json({
          title: 'AMDSB Application Approvals',
          inApp: true,
          isAuthenticated: req.session.isAuthenticated,
          name: req.session.account?.name,
          applist: Applist.rows,
          crossRef: finalMatches,
          allTickets: topDeskTickets,
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
