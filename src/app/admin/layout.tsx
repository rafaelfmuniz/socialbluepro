import type { Metadata } from "next";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ToastProvider from "@/components/providers/ToastProvider";
import AdminNavigation from "./AdminNavigation";
import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DefaultPasswordWarning } from "@/components/admin/DefaultPasswordWarning";

export const metadata: Metadata = {
  title: "SocialBluePro - Admin Dashboard",
  description: "SocialBluePro Admin Dashboard - Manage leads, campaigns and analytics",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        {session.user?.isDefaultPassword && <DefaultPasswordWarning userId={session.user.id} />}
        <AdminNavigation user={session.user}>
          {children}
        </AdminNavigation>
      </ToastProvider>
    </ErrorBoundary>
  );
}
