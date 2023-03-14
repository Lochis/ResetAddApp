/*var spauth = require('node-sp-auth');
var request = require('request-promise');
var $REST = require('gd-sprest');

require('dotenv').config();

function SPO () {
// SPO login url
//var url = "https://ecno.sharepoint.com/sites/VASPDocumentPublication/Shared%20Documents/Forms/";
var url ="https://amdsb.sharepoint.com/sites/Lucas"
spauth.getAuth(url, {
    username: process.env.SPO_USERNAME,
    password: process.env.SPO_PASSWORD,
    online: true
}).then((options) => {
    console.log('Connected to SPO');
})

 // Get the web
 var info = $REST.Web(url)
 // Get the 'Site Assets' library
 //.Lists("Site Assets")
 // Get the root folder
 .RootFolder()
 // Get the 'sprest' sub-folder
 //.Folders("sprest")
 // Get the files in the folder
 .Files()
 // Get the request information
 //.getInfo();

   // Copy the headers from the SP authentication
   for (var key in options.headers) {
    // Set the header
    info.headers[key] = options.headers[key];
}

request[info.method == "GET" ? "get" : "post"]({
    headers: info.headers,
    url: info.url,
    body: info.data
}).then(
    // Success
    response => {
        var obj = JSON.parse(response).d;
        if (obj.results && obj.results.length > 0) {
            // Parse the results
            for (var i = 0; i < obj.results.length; i++) {
                // Log
                console.log(obj.results[i]);
            }
        } else {
            // Log
            console.log(obj);
        }
    },
    // Error
    error => {
        // Log
        console.log("Error executing the request", error);
    }
);
}

module.exports ={
    SPO: SPO
}
*/