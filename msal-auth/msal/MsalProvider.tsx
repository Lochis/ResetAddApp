"use client";

import { MsalProvider as BaseMsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./msal-config";

const pca = new PublicClientApplication(msalConfig);

export function MsalProvider({ children }: { children: React.ReactNode }) {
  return <BaseMsalProvider instance={pca}>{children}</BaseMsalProvider>;
}
