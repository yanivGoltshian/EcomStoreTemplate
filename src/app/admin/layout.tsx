import type { Metadata } from "next";
import { site } from "@/lib/data";

const adminName = `ניהול · ${site.name}`;

export const metadata: Metadata = {
  title: adminName,
  applicationName: adminName,
  manifest: "/admin.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: adminName,
  },
  icons: {
    apple: [{ url: "/admin-apple-icon.png", sizes: "180x180" }],
  },
  robots: { index: false, follow: false },
};

// When `adminHost` is set in site config, the admin only runs on that single
// OAuth-authorized host; visiting the admin on any other origin (e.g. the public
// mirror, which is not an authorized Google OAuth JS origin and has no API
// backend) bounces the user to the configured host. Leave `adminHost` empty to
// disable the guard (e.g. single-host deployments).
const adminHost = site.adminHost?.trim() || "";
const ADMIN_HOST_GUARD = adminHost
  ? `(function(){try{var swa=${JSON.stringify(
      adminHost
    )};var h=location.hostname;if(h!==swa&&h!=="localhost"&&h!=="127.0.0.1"){location.replace("https://"+swa+"/admin/"+location.search+location.hash);}}catch(e){}})();`
  : "";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {ADMIN_HOST_GUARD ? (
        <script dangerouslySetInnerHTML={{ __html: ADMIN_HOST_GUARD }} />
      ) : null}
      {children}
    </>
  );
}
