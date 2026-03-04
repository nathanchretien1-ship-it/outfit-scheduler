import { User, LogOut } from "lucide-react";
import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function AuthNav() {
  const session = await auth();

  if (session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
        className="flex items-center space-x-1"
      >
        <span className="text-sm text-muted-foreground mr-4 hidden md:inline-block">
          Bonjour, {session.user.name || "Ami"}
        </span>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-destructive hover:text-destructive-foreground h-9 px-4 py-2"
        >
          <LogOut className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline-block">Déconnexion</span>
        </button>
      </form>
    );
  }

  return (
    <nav className="flex items-center space-x-1">
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
      >
        <User className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline-block">Connexion</span>
      </Link>
    </nav>
  );
}
