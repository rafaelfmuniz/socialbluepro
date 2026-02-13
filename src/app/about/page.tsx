import { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

export const metadata: Metadata = {
  title: "About SocialBluePro | Top Rated Landscapers in Denver",
  description: "Family-owned landscaping company serving Denver Metro since 2020. Licensed, insured, and dedicated to high-quality outdoor transformations.",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
