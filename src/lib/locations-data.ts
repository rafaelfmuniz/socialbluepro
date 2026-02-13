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
  },
  "castle-rock": {
    slug: "castle-rock",
    name: "Castle Rock",
    seoTitle: "Landscaping Services in Castle Rock, CO | SocialBluePro",
    metaDescription: "Professional landscaping in Castle Rock, Colorado. Sod installation, hardscaping, snow removal & property maintenance. Serving Castle Rock homeowners with premium outdoor solutions.",
    h1: "Expert Landscaping in Castle Rock, CO",
    intro: "Castle Rock's distinctive terrain and growing communities demand specialized landscaping knowledge. From The Meadows to Crystal Valley Ranch, we provide sod installation, custom hardscaping, and comprehensive property care that complements Castle Rock's scenic beauty and elevated lifestyle.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d98328.9676201431!2d-104.87458855!3d39.37245865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876c5c5f5f8a6c5d%3A0x6b8e3b5f6e9c4d7a!2sCastle%20Rock%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["The Meadows", "Crystal Valley Ranch", "Castlewood Ranch", "Founders Village", "Sagewood"],
    highlights: [
      "Castle Rock terrain specialists",
      "The Meadows community expertise",
      "Elevated property landscaping",
      "Mountain-modern design solutions"
    ]
  },
  "boulder": {
    slug: "boulder",
    name: "Boulder",
    seoTitle: "Landscaping in Boulder, CO | Sod & Hardscaping Services",
    metaDescription: "Expert landscaping services in Boulder, Colorado. Professional sod installation, hardscaping, xeriscaping & snow removal. Serving Boulder homeowners with eco-conscious solutions.",
    h1: "Professional Landscaping in Boulder, CO",
    intro: "Boulder's commitment to sustainability and outdoor living calls for innovative landscaping solutions. From historic Mapleton Hill to new developments in Gunbarrel, we provide sod installation, hardscaping, and xeriscaping services that align with Boulder's environmental values and active lifestyle.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d196281.13054844178!2d-105.26950135!3d40.014002450000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b8c5f5f8a6c5d%3A0x6b8e3b5f6e9c4d7a!2sBoulder%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Downtown Boulder", "Gunbarrel", "Mapleton Hill", "Chautauqua", "Table Mesa"],
    highlights: [
      "Eco-friendly landscaping solutions",
      "Boulder xeriscaping specialists",
      "Sustainable design practices",
      "Foothills property expertise"
    ]
  },
  "fort-collins": {
    slug: "fort-collins",
    name: "Fort Collins",
    seoTitle: "Landscaping Services in Fort Collins, CO | SocialBluePro",
    metaDescription: "Professional landscaping in Fort Collins, Colorado. Sod installation, hardscaping, seasonal maintenance & snow removal. Trusted landscapers serving Fort Collins homeowners.",
    h1: "Expert Landscaping in Fort Collins, CO",
    intro: "Fort Collins blends collegiate energy with natural beauty, requiring landscaping that respects both. From Old Town to Harmony Corridor, we provide sod installation, hardscaping, and year-round property care that enhances Fort Collins' distinctive character and outdoor appeal.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d196281.13054844178!2d-105.06950135!3d40.584002450000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87694a8c5f5f8a6c5d%3A0x6b8e3b5f6e9c4d7a!2sFort%20Collins%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Old Town", "Harmony Corridor", "Midtown", "Rigden Farm", "Waterglen"],
    highlights: [
      "Fort Collins climate specialists",
      "Old Town historic property care",
      "Commercial and residential services",
      "Year-round property maintenance"
    ]
  },
  "longmont": {
    slug: "longmont",
    name: "Longmont",
    seoTitle: "Landscaping in Longmont, CO | Sod Installation & Hardscaping",
    metaDescription: "Quality landscaping services in Longmont, Colorado. Professional sod, hardscaping, mulch & snow removal. Serving Longmont homeowners with reliable outdoor solutions.",
    h1: "Professional Landscaping in Longmont, CO",
    intro: "Longmont's agricultural heritage and modern growth create unique landscaping opportunities. From historic Downtown to new communities on the edges of town, we provide sod installation, hardscaping, and comprehensive property care that honors Longmont's roots while embracing its future.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d196281.13054844178!2d-105.11950135!3d40.174002450000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b9c5f5f8a6c5d%3A0x6b8e3b5f6e9c4d7a!2sLongmont%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Downtown Longmont", "Hover Ridge", "Sunset", "Southmoor Park", "Northwest Longmont"],
    highlights: [
      "Longmont agricultural heritage",
      "Rural and suburban expertise",
      "Irrigation and water management",
      "Seasonal cleanup specialists"
    ]
  },
  "broomfield": {
    slug: "broomfield",
    name: "Broomfield",
    seoTitle: "Landscaping Services in Broomfield, CO | SocialBluePro",
    metaDescription: "Expert landscaping in Broomfield, Colorado. Sod installation, hardscaping, property maintenance & snow removal. Serving Broomfield homeowners with quality care.",
    h1: "Landscaping in Broomfield, CO",
    intro: "Broomfield's strategic location and master-planned communities require landscaping that maintains high standards. From Interlocken to Broadlands, we provide sod installation, hardscaping, and reliable property maintenance that keeps Broomfield properties looking their best year-round.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d98328.9676201431!2d-105.07458855!3d39.92245865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b8f5f5f8a6c5d%3A0x6b8e3b5f6e9c4d7a!2sBroomfield%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Interlocken", "Broadlands", "McKay Landing", "Arista", "Aspen Creek"],
    highlights: [
      "Broomfield community specialists",
      "Master-planned community expertise",
      "Interlocken commercial services",
      "HOA-compliant landscaping"
    ]
  },
  "brighton": {
    slug: "brighton",
    name: "Brighton",
    seoTitle: "Landscaping in Brighton, CO | Sod & Hardscaping Services",
    metaDescription: "Professional landscaping services in Brighton, Colorado. Sod installation, hardscaping, mulch & snow removal. Trusted landscapers serving Brighton homeowners.",
    h1: "Expert Landscaping in Brighton, CO",
    intro: "Brighton's blend of rural charm and suburban development offers diverse landscaping possibilities. From historic downtown to newer subdivisions, we provide sod installation, hardscaping, and property maintenance that enhances Brighton's unique character and growing neighborhoods.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d98328.9676201431!2d-104.81458855!3d39.98245865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b9d5f5f8a6c5d%3A0x6b8e3b5f6e9c4d7a!2sBrighton%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Downtown Brighton", "Adams County", "Riverdale", "Todd Creek", "Barr Lake"],
    highlights: [
      "Brighton rural property expertise",
      "Large lot and acreage specialists",
      "Agricultural area knowledge",
      "Reliable seasonal services"
    ]
  },
  "thornton": {
    slug: "thornton",
    name: "Thornton",
    seoTitle: "Landscaping Services in Thornton, CO | SocialBluePro",
    metaDescription: "Expert landscaping in Thornton, Colorado. Sod installation, hardscaping, property maintenance & snow removal. Quality care for Thornton homeowners.",
    h1: "Professional Landscaping in Thornton, CO",
    intro: "Thornton's rapid growth and diverse neighborhoods require adaptable landscaping expertise. From original Thornton to newer developments like Trailmark, we provide sod installation, hardscaping, and comprehensive property care that meets the needs of this dynamic community.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d98328.9676201431!2d-104.93458855!3d39.87245865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b9e5f5f8a6c5d%3A0x6b8e3b5f6e9c4d7a!2sThornton%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Original Thornton", "Trailmark", "Carpenter Park", "Eastlake", "Grange Creek"],
    highlights: [
      "Thornton growth area specialists",
      "New construction landscaping",
      "Trailmark community expertise",
      "Comprehensive property maintenance"
    ]
  },
  "northglenn": {
    slug: "northglenn",
    name: "Northglenn",
    seoTitle: "Landscaping in Northglenn, CO | Sod Installation & Hardscaping",
    metaDescription: "Quality landscaping services in Northglenn, Colorado. Professional sod, hardscaping, mulch & snow removal. Serving Northglenn homeowners with dependable care.",
    h1: "Landscaping Services in Northglenn, CO",
    intro: "Northglenn's established neighborhoods and community-focused atmosphere deserve landscaping that enhances its suburban appeal. From Fox Run to Huron Crossing, we provide sod installation, hardscaping, and reliable property maintenance that keeps Northglenn homes looking beautiful throughout the seasons.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d98328.9676201431!2d-104.97458855!3d39.88245865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b9f5f5f8a6c5d%3A0x6b8e3b5f6e9c4d7a!2sNorthglenn%2C%20CO!5e0!3m2!1sen!2sus!4v1707686400000!5m2!1sen!2sus",
    nearbyAreas: ["Fox Run", "Huron Crossing", "Northwest", "Malley", "E.B. Rains Jr. Memorial Park"],
    highlights: [
      "Northglenn established neighborhood experts",
      "Community-focused landscaping",
      "Suburban property specialists",
      "Year-round maintenance services"
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
