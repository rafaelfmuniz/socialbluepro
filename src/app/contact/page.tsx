import { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact SocialBluePro | Get a Landscaping Quote in Denver",
  description: "Contact SocialBluePro for professional landscaping, sod installation, and hardscaping in Denver Metro. Get a free estimate today!",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
