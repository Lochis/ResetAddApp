const express = require("express");
const https = require("https");
const qr = require("qrcode");
const router = express.Router();

var topDeskTickets = '';
var options = {
    'method': 'GET',
    'headers': {
      'Authorization': process.env.TOPDESK_BASIC_AUTH
    }
  };
  const req = https.request("https://amdsb.topdesk.net/tas/api/assetmgmt/assets$orderby=name asc", options, (res) => {
  
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
    res.render('inventory', {
        title: 'AMDSB Application Approvals',
        inApp: false,
        inInv: true,
        isAuthenticated: req.session.isAuthenticated,
        name: req.session.account?.name,
        items: topDeskTickets,
        });
    } catch(error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/qr', async (req, res) => {
    //const url = req.body.url;
    url = "https://www.section.io/engineering-education/how-to-generate-qr-codes-using-nodejs/";
  
    qr.toDataURL(url, function (err, src){
        res.json({
            qrImg: src,
        })
    /*res.json({
      title: 'AMDSB Application Approvals',
      inApp: false,
      inInv: true,
      isAuthenticated: req.session.isAuthenticated,
      name: req.session.account?.name,
      qrImg: src,
      });*/
     });
  });


  module.exports = router;