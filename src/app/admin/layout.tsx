import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import { exigirAdmin } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Admin | BoraMEI",
  robots: { index: false, follow: false },
};

// A checagem aqui só evita renderizar a casca do admin para quem não é admin.
// Ela não substitui o exigirAdmin() de cada consulta (src/lib/admin/*) — ver
// o comentário em src/lib/dal.ts.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await exigirAdmin();

  return (
    <div className="flex min-h-screen bg-brand-bgLight">
      <Sidebar variante="admin" />
      <div className="min-w-0 flex-1 text-[#111827]">{children}</div>
    </div>
  );
}
