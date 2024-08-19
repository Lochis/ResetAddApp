const CLIENT_ID = process.env.CLIENT_ID;

export const API_SCOPE =
  "api://6edff783-cc3a-4e07-94dd-0a0855496364/msal-node-api";

export const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_TENANT_ID}`,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI,
    postLogoutRedirectUri: process.env.NEXT_PUBLIC_POST_LOGOUT_REDIRECT_URI,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [API_SCOPE],
};

export const userDataLoginRequest = {
  scopes: ["user.read"],
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};
