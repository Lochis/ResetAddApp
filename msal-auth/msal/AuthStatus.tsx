"use client";

import { useIsAuthenticated, useMsal } from "@azure/msal-react";

export default function AuthStatus() {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();

  if (isAuthenticated) {
    return <button onClick={() => instance.logoutRedirect()}>Logout</button>;
  } else {
    return <button onClick={() => instance.loginRedirect()}>Login</button>;
  }
}
