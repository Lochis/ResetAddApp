"use client"
import { handleLogin } from "../_utils/msal";

export default function Header() {
  return (
    <header className="bg-gray-900">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
        <div className="flex lg:flex-1">
          <a href="/" className="text-2xl">Reset Add App</a>
        </div>
        <div className="flex lg:flex-end">
          <button onClick={handleLogin} className="border hover:border-blue-400 transition-all transition-duration:400ms border-blue-600 bg-blue-900 rounded-xl py-1 px-4">Log In</button>
        </div>
      </nav>
    </header>
  );
}
