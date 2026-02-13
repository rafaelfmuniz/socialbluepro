import { Metadata } from "next";
import { notFound } from "next/navigation";
import { locationsData } from "@/lib/locations-data";
import LocationPageClient from "./LocationPageClient";

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const location = locationsData[city];

  if (!location) {
    return {
      title: "Location Not Found | SocialBluePro",
    };
  }

  return {
    title: location.seoTitle,
    description: location.metaDescription,
    alternates: {
      canonical: `https://socialbluepro.com/locations/${city}`,
    },
    openGraph: {
      title: location.seoTitle,
      description: location.metaDescription,
      url: `https://socialbluepro.com/locations/${city}`,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(locationsData).map((city) => ({
    city: city,
  }));
}

export default async function LocationPage({ params }: Props) {
  const { city } = await params;
  const location = locationsData[city];

  if (!location) {
    notFound();
  }

  return <LocationPageClient location={location} />;
}
