import { Metadata } from "next";
import ServicesPageClient from "./ServicesPageClient";

export const metadata: Metadata = {
  title: "Landscaping Services in Denver | SocialBluePro Solutions",
  description: "Comprehensive landscape solutions for Colorado homes. Sod installation, hardscaping, snow removal, and more in Denver Metro.",
};

export default function ServicesPage() {
  return <ServicesPageClient />;
}
