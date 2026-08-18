import { AdminLayout } from "@/components/Layouts/AdminLayout";
import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Statistik Demak",
  description: "Dasbor Manajemen Peta Tematik Kabupaten Demak",
};

export default function RootAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
