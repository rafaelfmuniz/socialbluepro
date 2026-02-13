import { Metadata } from "next";
import { notFound } from "next/navigation";
import { servicesData } from "@/lib/services-data";
import ServicePageClient from "./ServicePageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = servicesData[slug];

  if (!service) {
    return {
      title: "Service Not Found | SocialBluePro",
    };
  }

  return {
    title: service.seoTitle,
    description: service.metaDescription,
    alternates: {
      canonical: `https://socialbluepro.com/services/${slug}`,
    },
    openGraph: {
      title: service.seoTitle,
      description: service.metaDescription,
      images: [
        {
          url: service.image,
          width: 1200,
          height: 630,
          alt: service.title,
        },
      ],
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(servicesData).map((slug) => ({
    slug: slug,
  }));
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = servicesData[slug];

  if (!service) {
    notFound();
  }

  return <ServicePageClient service={service} />;
}
