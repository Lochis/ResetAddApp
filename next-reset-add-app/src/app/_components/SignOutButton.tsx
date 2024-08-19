'use client'
import { handleLogout } from "../_utils/msal";

const SignOutButton = ({ className = "fancybtn", text = "Logout" }) => {
  return (
    <button type="button" className={className} onClick={() => handleLogout("redirect")}>
      {text}
    </button>
  );
};
export default SignOutButton;
