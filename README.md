# ResetAddApp Web Application
http://resetaddapp.azurewebsites.net/

# If can't npm start -> Remember, this uses node v18

Reads and writes to Azure Blob Storage container to use JSON file as pseudo database

Wrapped Azure AD SSO functionality to only allow certain users to use the web app
- Hosted the web app in Azure Web App, free plan. Note: Since it's on this free plan, it may take a bit to load when trying to connect to the website.
- Set up Enterprise Application for permissions

.env is hidden, but used https://github.com/Azure-Samples/ms-identity-node to get me on the right track

TODO:
- Styling (Very barebones at the moment, using html, bootstrap)
      - updated styling using bootstrap, lacks content (but for the functionality, it doesn't need it)
- Automated reading of Excel online spreadsheet and/or detecting when a new folder is uploaded to sharepoint directory to then copy into own directory
      - Might be hard to do using the Microsoft graph api since I do not have access to the guest tenant...
      - Conditional Access perms do not allow this, have to find a work around

- Create how to video on root route after authentication
