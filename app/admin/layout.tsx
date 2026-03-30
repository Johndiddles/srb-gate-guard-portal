import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh min-h-0 overflow-hidden">
      <Sidebar />
      <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50">{children}</main>
    </div>
  );
}
