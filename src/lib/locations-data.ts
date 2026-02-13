export interface LocationData {
  slug: string;
  name: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  mapEmbed: string;
  nearbyAreas: string[];
  highlights: string[];
}

export const locationsData: Record<string, LocationData> = {
  "denver": {
    slug: "denver",
    name: "Denver",
    seoTitle: "Professional Landscaping Services in Denver, CO | SocialBluePro",
    metaDescription: "Denver's trusted landscaping company. Sod installation, hardscaping, snow removal & more. Licensed, insured & locally owned. Free estimates available.",
    h1: "Professional Landscaping in Denver, CO",
    intro: "Serving Denver homeowners with premium sod installation, hardscaping, and year-round property care. As a locally-owned Denver company, we understand Colorado's unique climate and soil conditions. From Capitol Hill to Cherry Creek, we deliver exceptional outdoor transformations tailored to Denver's diverse neighborhoods.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d196281.13054844178!2d-105.01950135!3d39.764002450000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b80aa231f17cf%3A0x118ef4f8278a36d6!2sDenver%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Capitol Hill", "Cherry Creek", "Highlands", "LoDo", "Wash Park", "Stapleton"],
    highlights: [
      "Local Denver expertise since 2020",
      "Knowledge of Colorado's clay soil and climate",
      "Full-service landscaping & snow removal",
      "Licensed & insured in Denver County"
    ]
  },
  "aurora": {
    slug: "aurora",
    name: "Aurora",
    seoTitle: "Landscaping Services in Aurora, CO | SocialBluePro",
    metaDescription: "Expert landscaping in Aurora, Colorado. Sod, hardscaping, snow removal & seasonal cleanup. Reliable service for Aurora homeowners. Get a free quote today!",
    h1: "Professional Landscaping in Aurora, CO",
    intro: "Transform your Aurora property with our comprehensive landscaping services. From the booming neighborhoods near Southlands to established communities in Original Aurora, we provide sod installation, hardscaping, and reliable snow removal tailored to Aurora's growing residential areas.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d196622.0541321479!2d-104.80248235!3d39.729431950000005!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876c8c366c6fbf33%3A0x7e5a0f2e1d9b91e9!2sAurora%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Southlands", "Original Aurora", "Tallyn's Reach", "Saddle Rock", "Murphy Creek"],
    highlights: [
      "Serving all Aurora neighborhoods",
      "Aurora-specific plant and material recommendations",
      "Seasonal contracts available",
      "Quick response times for Aurora residents"
    ]
  },
  "centennial": {
    slug: "centennial",
    name: "Centennial",
    seoTitle: "Landscaping & Sod Installation in Centennial, CO | SocialBluePro",
    metaDescription: "Premium landscaping services in Centennial, Colorado. Professional sod, hardscaping patios, and snow removal. Enhance your Centennial home's curb appeal today!",
    h1: "Expert Landscaping in Centennial, CO",
    intro: "Centennial homeowners trust SocialBluePro for high-quality landscaping that matches the community's beautiful aesthetic. Whether you're in The Hills, Willow Creek, or Piney Creek, we deliver meticulous sod installation, custom hardscaping, and dependable snow removal services.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d98328.9676201431!2d-104.93435455!3d39.59073565!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876c86b9ba7a6407%3A0x26bed543fca6e86e!2sCentennial%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["The Hills", "Willow Creek", "Piney Creek", "Homestead", "Southglenn"],
    highlights: [
      "Centennial neighborhood expertise",
      "HOA-compliant landscaping designs",
      "Premium materials for upscale properties",
      "Dedicated snow removal for Centennial homes"
    ]
  },
  "parker": {
    slug: "parker",
    name: "Parker",
    seoTitle: "Landscaping Services in Parker, CO | Sod & Hardscaping",
    metaDescription: "Professional landscaping in Parker, Colorado. Sod installation, custom patios, retaining walls & snow removal. Serving Parker homeowners since 2020.",
    h1: "Landscaping Services in Parker, CO",
    intro: "Parker's blend of modern developments and horse country properties requires specialized landscaping expertise. From Stonegate to Pradera, we provide sod installation, hardscaping, and comprehensive property care that respects Parker's unique character and larger lot sizes.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d196632.22980537478!2d-104.78269095!3d39.518448249999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876c8f9f0a0b0b0b%3A0x0!2sParker%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Stonegate", "Pradera", "Canterberry", "Clarke Farms", "Sierra Ridge"],
    highlights: [
      "Large property and acreage expertise",
      "Parker's freeze-thaw climate specialists",
      "Custom hardscaping for outdoor living",
      "Rural and suburban property experience"
    ]
  },
  "littleton": {
    slug: "littleton",
    name: "Littleton",
    seoTitle: "Landscaping in Littleton, CO | Sod, Hardscaping & Snow Removal",
    metaDescription: "Top-rated landscaping services in Littleton, Colorado. Sod installation, decorative rock, patios & snow removal. Transform your Littleton property today!",
    h1: "Professional Landscaping in Littleton, CO",
    intro: "Littleton's historic charm and diverse architecture deserve landscaping that complements its character. From Downtown Littleton to Ken Caryl and Columbine, we provide thoughtful sod installation, elegant hardscaping, and reliable seasonal services that enhance this beloved community.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d98328.9676201431!2d-105.07645055!3d39.61335165!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b801a8f6f3d9b%3A0x7c7812a6a7f5d2f1!2sLittleton%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Downtown Littleton", "Ken Caryl", "Columbine", "South Park", "Meadows"],
    highlights: [
      "Historic Littleton property expertise",
      "Heritage-conscious landscaping design",
      "Ken Caryl and foothills experience",
      "Year-round property maintenance"
    ]
  },
  "highlands-ranch": {
    slug: "highlands-ranch",
    name: "Highlands Ranch",
    seoTitle: "Landscaping Services in Highlands Ranch, CO | SocialBluePro",
    metaDescription: "Expert landscaping in Highlands Ranch, Colorado. Sod, hardscaping, mulch & snow removal. Serving Highlands Ranch homeowners with premium outdoor solutions.",
    h1: "Landscaping in Highlands Ranch, CO",
    intro: "Highlands Ranch is known for its beautiful homes and well-maintained properties. We help homeowners throughout the community—from Westridge to Eastridge—maintain that standard with professional sod installation, decorative rock and mulch services, and prompt snow removal.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d98328.9676201431!2d-105.00543355!3d39.54845865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876c831449098d43%3A0x8a7e7b5a9f3a8c5d!2sHighlands%20Ranch%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Westridge", "Eastridge", "Northridge", "Southridge", "BackCountry"],
    highlights: [
      "Highlands Ranch community specialists",
      "BackCountry and luxury home experience",
      "HOA guideline compliance",
      "Consistent, reliable service"
    ]
  },
  "lakewood": {
    slug: "lakewood",
    name: "Lakewood",
    seoTitle: "Landscaping in Lakewood, CO | Sod Installation & Hardscaping",
    metaDescription: "Professional landscaping services in Lakewood, Colorado. Sod, hardscaping, seasonal cleanup & snow removal. Serving Lakewood residents with quality care.",
    h1: "Expert Landscaping in Lakewood, CO",
    intro: "Lakewood's proximity to the foothills creates unique landscaping challenges and opportunities. From Belmar to Green Mountain, we understand the slope management, soil conditions, and wind exposure that Lakewood properties face, delivering sod, hardscaping, and maintenance solutions that last.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d98328.9676201431!2d-105.15008955!3d39.70445865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b80e206142553%3A0x6e49669e5c7c25e6!2sLakewood%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Belmar", "Green Mountain", "Applewood", "Morrison Road", "Union Square"],
    highlights: [
      "Foothills and slope expertise",
      "Belmar area commercial & residential",
      "Wind-resistant landscaping solutions",
      "Green Mountain soil specialists"
    ]
  },
  "wheat-ridge": {
    slug: "wheat-ridge",
    name: "Wheat Ridge",
    seoTitle: "Landscaping Services in Wheat Ridge, CO | SocialBluePro",
    metaDescription: "Quality landscaping in Wheat Ridge, Colorado. Sod, hardscaping, mulch installation & more. Trusted local landscapers serving Wheat Ridge homeowners.",
    h1: "Professional Landscaping in Wheat Ridge, CO",
    intro: "Wheat Ridge combines established neighborhoods with a proud agricultural heritage. We serve this tight-knit community with sod installation, hardscaping, and property maintenance that respects the area's history while delivering modern landscaping excellence.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d98328.9676201431!2d-105.11268855!3d39.76982365!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b89b898f8a6c5%3A0x6b8e3b5f6e9c4d7a!2sWheat%20Ridge%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Carnival", "Wheat Ridge Heights", "Applewood", "Discovery Ridge"],
    highlights: [
      "Wheat Ridge community focused",
      "Established neighborhood specialists",
      "Agricultural heritage-aware designs",
      "Reliable seasonal services"
    ]
  },
  "golden": {
    slug: "golden",
    name: "Golden",
    seoTitle: "Landscaping in Golden, CO | Sod & Hardscaping Services",
    metaDescription: "Professional landscaping in Golden, Colorado. Sod installation, rock work, patios & snow removal. Serving Golden homeowners near the foothills.",
    h1: "Landscaping Services in Golden, CO",
    intro: "Golden's stunning foothills location demands landscaping that can handle elevation, wind, and variable weather. From historic downtown to Genesee and Lookout Mountain areas, we provide sod, hardscaping, and property care designed for Golden's unique mountain-urban environment.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d49123.9676201431!2d-105.24768855!3d39.75482365!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b8c95d9e7663d%3A0x7a6f3a7f5e8c2b9d!2sGolden%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Downtown Golden", "Genesee", "Lookout Mountain", "Mesa Meadows", "Magic Mountain"],
    highlights: [
      "Foothills and mountain property expertise",
      "Golden's unique climate specialists",
      "Historic downtown area experience",
      "Elevation-appropriate plant selection"
    ]
  },
  "arvada": {
    slug: "arvada",
    name: "Arvada",
    seoTitle: "Landscaping in Arvada, CO | Sod, Hardscaping & Snow Removal",
    metaDescription: "Expert landscaping services in Arvada, Colorado. Professional sod, hardscaping, mulch & snow removal. Serving Arvada homeowners with quality care.",
    h1: "Professional Landscaping in Arvada, CO",
    intro: "Arvada's mix of historic Olde Town charm and new developments requires versatile landscaping expertise. From established neighborhoods to new communities like Candelas, we provide sod installation, hardscaping, and year-round property maintenance that enhances Arvada's diverse architectural styles.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d98328.9676201431!2d-105.13458855!3d39.80245865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b8e5f5f8a6c5d%3A0x6b8e3b5f6e9c4d7a!2sArvada%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Olde Town", "Candelas", "West Woods", "Lake Arbor", "Meadowglen"],
    highlights: [
      "Olde Town historic property expertise",
      "New development landscaping specialists",
      "Candelas and West Woods experience",
      "Comprehensive seasonal services"
    ]
  }
};

export const locationSlugs = Object.keys(locationsData);

export function getLocationBySlug(slug: string): LocationData | undefined {
  return locationsData[slug];
}

export function getAllLocations(): LocationData[] {
  return Object.values(locationsData);
}
