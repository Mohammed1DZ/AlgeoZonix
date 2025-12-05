// This file is intentionally left blank.
// The layout for the admin section is now handled by route groups
// to separate the login page from the protected dashboard pages.
// See /admin/(dashboard)/layout.tsx for the main dashboard layout.

export default function AdminRootLayout({ children }: { children: React.ReactNode; }) {
  return <>{children}</>;
}
