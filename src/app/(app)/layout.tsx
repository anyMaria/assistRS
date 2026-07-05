import { Nav } from "@/components/Nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="md:ml-56 px-4 md:px-8 py-6 pb-24 md:pb-10 max-w-6xl">
        {children}
      </main>
    </div>
  );
}
