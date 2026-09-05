import { Navbar } from "@/components/layout/Navbar";
import { auth } from "@/lib/auth/auth";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-full flex-col">
      <Navbar user={session?.user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
