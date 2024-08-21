import AuthStatus from "@/msal/AuthStatus";
import Image from "next/image";

export default function Header() {
  return (
    <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
      <div className="fixed text-xl bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
        <a
          className="pointer-events-auto flex place-items-center gap-2 p-8 lg:p-0"
          href="/"
          rel="noopener noreferrer"
        >
          ResetAddApp
        </a>
      </div>
      <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
        <AuthStatus />
      </p>
    </div>
  )
}
