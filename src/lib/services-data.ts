import { IMAGES } from "./constants";
import { 
  Sprout, 
  Hammer, 
  Snowflake, 
  Mountain, 
  Leaf, 
  Trees, 
  Scissors, 
  Wrench, 
  Building
} from "lucide-react";

export interface ServiceData {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  image: string;
  heroHeadline: string;
  description: string;
  benefits: string[];
  process: {
    title: string;
    description: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

export const servicesData: Record<string, ServiceData> = {
  "sod-installation": {
    slug: "sod-installation",
    title: "Sod Installation",
    seoTitle: "Professional Sod Installation in Denver, CO | SocialBluePro",
    metaDescription: "Transform your yard instantly with premium Colorado sod. Expert soil prep, grading, and fresh sod installation in Denver. Get your free estimate today!",
    image: IMAGES.sod,
    heroHeadline: "Instant Green Lawns for Denver Homes.",
    description: "Achieving a perfect lawn in Colorado's semi-arid climate is a challenge. Seeding often leads to patchy results and years of waiting. Our professional sod installation service gives you an immediate, lush, and weed-free yard in just one day. We use high-quality, Colorado-grown sod varieties specifically selected for their drought tolerance and durability in the Denver Metro area.",
    benefits: [
      "Immediate Transformation: From dirt to lush green in hours.",
      "Weed-Free Start: Fresh sod blocks out invasive weeds from the start.",
      "Erosion Control: Instantly stabilizes soil on slopes and flat areas.",
      "Water Efficiency: Established sod requires less water than germinating seeds.",
      "Natural Cooling: Reduces ground temperature by up to 15 degrees compared to bare soil."
    ],
    process: [
      {
        title: "Site Preparation",
        description: "We remove existing debris, weeds, and old turf to create a clean slate for your new lawn."
      },
      {
        title: "Soil Amendment & Tilling",
        description: "Colorado soil is often heavy clay. We till and add organic amendments to ensure deep root growth."
      },
      {
        title: "Professional Grading",
        description: "Crucial for drainage. We level the area to prevent pooling and ensure water flows away from your foundation."
      },
      {
        title: "Precision Installation",
        description: "Our team lays the sod in a staggered pattern, ensuring tight seams for a seamless, carpet-like look."
      }
    ],
    faqs: [
      {
        question: "When is the best time to install sod in Denver?",
        answer: "Spring (April-June) and Fall (September-October) are ideal due to cooler temperatures, but sod can be successfully installed throughout the growing season if watered properly."
      },
      {
        question: "How much does sod installation cost in Colorado?",
        answer: "Pricing depends on the area size and soil prep needs. We provide free, on-site estimates to give you an accurate quote for your specific property."
      },
      {
        question: "How often should I water new sod?",
        answer: "New sod needs daily watering for the first 2-3 weeks to establish roots. We provide a detailed watering schedule tailored to Denver's current weather conditions."
      }
    ]
  },
  "hardscaping": {
    slug: "hardscaping",
    title: "Hardscaping",
    seoTitle: "Custom Hardscaping & Patios in Denver, CO | SocialBluePro",
    metaDescription: "Enhance your outdoor living with professional hardscaping in Denver. Custom patios, retaining walls, and stone walkways designed for Colorado's lifestyle.",
    image: IMAGES.hardscaping,
    heroHeadline: "Structural Beauty for Your Outdoor Living.",
    description: "Our hardscaping services blend functionality with aesthetic appeal to create durable outdoor spaces that withstand Denver's freeze-thaw cycles. From elegant paver patios to structural retaining walls, we use premium materials that complement Colorado's natural beauty.",
    benefits: [
      "Increased Property Value: Hardscaping is one of the best ROIs for home improvement.",
      "Low Maintenance: Stone and pavers require minimal upkeep compared to lawns.",
      "Extended Living Space: Create an 'outdoor room' for dining and relaxation.",
      "Erosion Management: Retaining walls effectively manage soil movement on slopes.",
      "Durability: Materials selected specifically for Denver's unique climate."
    ],
    process: [
      {
        title: "Design Consultation",
        description: "We discuss your vision, material preferences, and how you plan to use the space."
      },
      {
        title: "Excavation & Base Prep",
        description: "The foundation is key. We dig to proper depths and use compacted base materials to prevent shifting."
      },
      {
        title: "Expert Installation",
        description: "Our skilled craftsmen lay each stone or block with precision, ensuring level surfaces and proper drainage."
      },
      {
        title: "Finishing & Cleanup",
        description: "We apply polymeric sand to joints and seal surfaces if requested, leaving your property spotless."
      }
    ],
    faqs: [
      {
        question: "What materials do you use for patios in Denver?",
        answer: "We work with a variety of materials including concrete pavers, flagstone, and natural stone, choosing options that handle Colorado's temperature swings."
      },
      {
        question: "How long does a typical hardscaping project take?",
        answer: "Most patios and small walls take 3-7 days, depending on weather and project complexity."
      }
    ]
  },
  "snow-removal": {
    slug: "snow-removal",
    title: "Snow Removal",
    seoTitle: "Reliable Snow Removal Services in Denver, CO | SocialBluePro",
    metaDescription: "Professional residential snow clearing and de-icing in Denver. Keep your driveway and walkways safe all winter. Seasonal contracts and one-time services.",
    image: IMAGES.snow,
    heroHeadline: "Winter Safety & Reliability for Denver Homes.",
    description: "Denver winters are unpredictable. Our snow removal service ensures your property remains safe and accessible even after the heaviest Colorado blizzards. We prioritize efficiency and safety, providing professional clearing for driveways and sidewalks.",
    benefits: [
      "Safety First: Prevent slips and falls on icy surfaces.",
      "Time Saving: Wake up to a clear driveway without lifting a shovel.",
      "Reliable Equipment: Professional-grade plows and blowers for heavy snow.",
      "De-Icing Included: We use safe ice-melt products to prevent refreezing.",
      "Compliance: Ensure your sidewalks meet Denver's snow removal ordinances."
    ],
    process: [
      {
        title: "Storm Monitoring",
        description: "We track Denver weather patterns 24/7 to deploy our teams as soon as snow starts accumulating."
      },
      {
        title: "Professional Clearing",
        description: "Our teams clear driveways and walkways using the most efficient tools for your specific layout."
      },
      {
        title: "Ice Management",
        description: "We apply eco-friendly ice melt to prevent hazardous ice patches from forming."
      }
    ],
    faqs: [
      {
        question: "When do you start snow removal?",
        answer: "Our teams typically deploy once snow reaches a 2-inch accumulation, or as per your specific contract agreement."
      },
      {
        question: "Do you offer residential snow contracts in Denver?",
        answer: "Yes, we offer seasonal contracts that guarantee priority service during every snow event."
      }
    ]
  },
  "decorative-rock": {
    slug: "decorative-rock",
    title: "Decorative Rock",
    seoTitle: "Decorative Landscape Rock Installation in Denver | SocialBluePro",
    metaDescription: "Upgrade your landscape with premium decorative rock. Low-maintenance river rock, granite, and stone installation in Denver and Colorado Metro.",
    image: IMAGES.rock,
    heroHeadline: "Elegant, Low-Maintenance Colorado Landscapes.",
    description: "Decorative rock is the perfect solution for Denver homeowners seeking a beautiful, water-wise landscape. We offer a wide variety of local Colorado stones, from smooth river rocks to jagged granites, providing texture and contrast to your garden beds.",
    benefits: [
      "Water Conservation: Reduces soil evaporation, perfect for xeriscaping.",
      "Weed Suppression: Combined with professional fabric, rock blocks weeds effectively.",
      "No Mulch Fade: Rock maintains its color and structure for years.",
      "Erosion Control: Heavy stone stays in place even during Colorado's wind and rain.",
      "Aesthetic Variety: Choose from dozens of colors and sizes to match your home."
    ],
    process: [
      {
        title: "Site Clearing",
        description: "We remove old mulch or debris and level the ground for a uniform look."
      },
      {
        title: "Fabric Installation",
        description: "We lay high-quality, professional-grade weed barrier fabric to prevent growth from beneath."
      },
      {
        title: "Rock Spreading",
        description: "We install the rock at the correct depth (typically 2-3 inches) to ensure full coverage and longevity."
      }
    ],
    faqs: [
      {
        question: "Is rock better than mulch for Denver yards?",
        answer: "Rock is more permanent and better for water conservation (xeriscaping), while mulch is better for plant health and soil organic matter."
      }
    ]
  },
  "mulch-installation": {
    slug: "mulch-installation",
    title: "Mulch Installation",
    seoTitle: "Professional Mulch Installation in Denver, CO | SocialBluePro",
    metaDescription: "High-quality organic mulch installation for Denver gardens. Improve plant health, conserve water, and enhance curb appeal. Free estimates.",
    image: IMAGES.mulch,
    heroHeadline: "Nurture Your Garden with Premium Mulch.",
    description: "Professional mulch installation is more than just an aesthetic upgrade. In Denver's dry climate, mulch acts as a vital protective layer, retaining moisture for your plants and regulating soil temperature throughout the seasons.",
    benefits: [
      "Moisture Retention: Cuts watering needs significantly by reducing evaporation.",
      "Soil Improvement: Organic mulch breaks down over time, enriching your soil.",
      "Temperature Control: Keeps roots cooler in summer and warmer in winter.",
      "Curb Appeal: Instantly gives your garden beds a clean, finished look.",
      "Weed Prevention: Blocks sunlight to germinating weed seeds."
    ],
    process: [
      {
        title: "Edge Definition",
        description: "We create clean, deep edges around your beds to keep mulch contained and looking professional."
      },
      {
        title: "Weed Cleanup",
        description: "We pull existing weeds before installation to ensure a fresh, clean start."
      },
      {
        title: "Even Spreading",
        description: "We apply a consistent 3-inch layer of high-quality mulch for maximum benefit."
      }
    ],
    faqs: [
      {
        question: "How often should I refresh my mulch in Colorado?",
        answer: "We recommend a refresh once a year or every two years to maintain color and effectiveness as the organic material breaks down."
      }
    ]
  },
  "spring-fall-clean-up": {
    slug: "spring-fall-clean-up",
    title: "Spring/Fall Clean Up",
    seoTitle: "Seasonal Yard Cleanup Services in Denver, CO | SocialBluePro",
    metaDescription: "Prepare your property for Colorado's changing seasons. Professional leaf removal, pruning, and debris cleanup in Denver. One-time restoration.",
    image: IMAGES.cleanup,
    heroHeadline: "Reset Your Property for the Changing Seasons.",
    description: "Colorado's seasons can be harsh on landscapes. Our comprehensive Spring and Fall cleanup services restore your property's health and appearance, handling the heavy lifting of leaf removal and garden bed preparation.",
    benefits: [
      "Healthy Lawn: Removing leaves prevents mold and disease during winter.",
      "Ready for Growth: Spring cleanup prepares your soil and plants for the growing season.",
      "Professional Appearance: A clean yard instantly boosts curb appeal.",
      "Saves Time: Our team handles in hours what takes homeowners weekends to finish.",
      "Safe Disposal: We haul away all debris, leaving you with a spotless property."
    ],
    process: [
      {
        title: "Leaf & Debris Removal",
        description: "We blow out beds and rake lawns to remove all organic clutter."
      },
      {
        title: "Perennial Pruning",
        description: "Cutting back dead growth to encourage healthy new shoots."
      },
      {
        title: "Gutter Cleaning (Optional)",
        description: "Ensuring your drainage system is ready for Colorado's rain or snow."
      }
    ],
    faqs: [
      {
        question: "When should I book a Fall cleanup in Denver?",
        answer: "Late October to mid-November is usually best, once most leaves have fallen but before the ground freezes."
      }
    ]
  },
  "one-time-weed-pulling": {
    slug: "one-time-weed-pulling",
    title: "One-Time Weed Pulling",
    seoTitle: "Professional Manual Weed Removal in Denver | SocialBluePro",
    metaDescription: "Deep, manual weed removal for overgrown gardens. Restore your landscape with our professional weed pulling service in Denver. No chemicals needed.",
    image: IMAGES.weed,
    heroHeadline: "Reclaim Your Garden from Invasive Growth.",
    description: "Sometimes garden beds get out of control. Our manual weed pulling service is a deep-clean for your landscape. We go beyond surface-level trimming, removing weeds by the root to ensure a longer-lasting clean without relying solely on chemicals.",
    benefits: [
      "Root Removal: Pulling by hand ensures the root comes out, preventing fast regrowth.",
      "Chemical-Free Options: Ideal for homes with pets or children.",
      "Plant Safety: We carefully distinguish between weeds and your prized perennials.",
      "Instant Restoration: Watch your garden beds transform from messy to manicured.",
      "Foundation for Mulch: The perfect first step before installing new rock or mulch."
    ],
    process: [
      {
        title: "Assessment",
        description: "We identify invasive species and plan the removal without harming your desirable plants."
      },
      {
        title: "Manual Extraction",
        description: "Our team uses specialized tools to pull weeds from the root."
      },
      {
        title: "Debris Bagging",
        description: "We collect and remove all weeds from the property so they don't re-seed."
      }
    ],
    faqs: [
      {
        question: "Do you use sprays or hand-pull?",
        answer: "We specialize in manual hand-pulling for precision, but can apply post-emergent treatments upon request to keep weeds away longer."
      }
    ]
  },
  "custom-landscaping": {
    slug: "custom-landscaping",
    title: "Custom Landscaping",
    seoTitle: "Custom Landscape Design & Installation in Denver | SocialBluePro",
    metaDescription: "Full-scale property transformations in Denver, CO. Custom landscape design, installation, and project management for your dream outdoor space.",
    image: IMAGES.custom,
    heroHeadline: "Your Vision, Our Expertise. Built for Colorado.",
    description: "For homeowners looking for a total transformation, our custom landscaping service offers end-to-end project management. We combine all our expertise—sod, rock, mulch, and plants—to create a cohesive, beautiful outdoor environment tailored to your lifestyle.",
    benefits: [
      "Unified Design: Every element of your yard works together harmoniously.",
      "Expert Plant Selection: We choose species that thrive in Denver's USDA Zone 5 climate.",
      "Complete Management: We handle everything from ground prep to the final flower.",
      "Personalized for You: Designed for how you use your outdoor space.",
      "Quality Assurance: One team, one standard of excellence for the entire project."
    ],
    process: [
      {
        title: "Concept Meeting",
        description: "We walk your property and discuss goals, budget, and styles."
      },
      {
        title: "Detailed Proposal",
        description: "A comprehensive plan outlining materials, timelines, and costs."
      },
      {
        title: "Phased Execution",
        description: "From hardscaping and grading to final planting and mulch."
      }
    ],
    faqs: [
      {
        question: "Do you provide landscape designs?",
        answer: "We provide functional layout plans and material consultations to guide the project to success."
      }
    ]
  },
  "commercial-landscaping": {
    slug: "commercial-landscaping",
    title: "Commercial Landscaping",
    seoTitle: "Commercial Landscaping & Snow Management in Denver | SocialBluePro",
    metaDescription: "Professional landscaping and snow removal for Denver businesses. Reliable property maintenance, ice management, and routine care. Contact us today.",
    image: IMAGES.commercial,
    heroHeadline: "Reliable Property Care for Denver Businesses.",
    description: "Your property's appearance is your first impression. We provide Denver commercial property managers with a single, reliable point of contact for year-round care, from routine landscaping to critical winter snow and ice management.",
    benefits: [
      "Reliability: We show up as scheduled, every time.",
      "Comprehensive Care: Landscaping, snow, weeds, and parking lot cleanup.",
      "Liability Reduction: Expert snow and ice management keeps your customers safe.",
      "Professional Equipment: Capable of handling large parking lots and complex properties.",
      "Transparent Billing: Easy, professional invoicing and contract management."
    ],
    process: [
      {
        title: "Site Survey",
        description: "We analyze your commercial property's specific needs and traffic patterns."
      },
      {
        title: "Custom Contract",
        description: "A tailored service plan that meets your budget and maintenance standards."
      },
      {
        title: "Proactive Service",
        description: "We handle issues before you have to call us."
      }
    ],
    faqs: [
      {
        question: "Do you offer multi-year commercial contracts?",
        answer: "Yes, we provide flexible contract options to ensure consistent care for your business property."
      }
    ]
  }
};
