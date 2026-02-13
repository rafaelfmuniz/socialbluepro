"use client";

import { getCampaigns, updateCampaign, deleteCampaign, createCampaign } from "@/actions/campaigns";
import { getLeads, updateLeadStatus } from "@/actions/leads";
import { useRealTimePoll } from "@/lib/hooks/useRealTimePoll";
import { PageContainer, PageHeader } from "@/components/ui/PageContainer";

// Local database compatibility wrapper using server actions
function createClient() {
  return {
    from(table: string) {
      return {
        select() {
          return {
            async then(callback?: (data: any) => any) {
              try {
                let data: any;
                switch(table) {
                  case 'campaigns':
                    data = await getCampaigns(1000); // large limit to get all
                    break;
                  case 'leads':
                    data = await getLeads();
                    break;
                  default:
                    data = [];
                }
                if (callback) return callback({ data, error: null });
                return { data, error: null };
              } catch (error: any) {
                if (callback) return callback({ data: null, error: error.message });
                return { data: null, error: error.message };
              }
            }
          }
        },
        update(data: any) {
          return {
            eq: (column: string, value: any) => ({
              async then(callback?: (data: any) => any) {
                try {
                  let result: any;
                  switch(table) {
                    case 'campaigns':
                      result = await updateCampaign(value, data);
                      if (result.success) {
                        result = result.data;
                      } else {
                        throw new Error(result.error);
                      }
                      break;
                    case 'leads':
                      // Note: updateLeadStatus expects lead ID and status
                      // Assuming data contains status field
                      const status = data.status || data;
                      result = await updateLeadStatus(value, status);
                      if (result.success) {
                        result = result.data;
                      } else {
                        throw new Error(result.error);
                      }
                      break;
                    default:
                      throw new Error(`Unknown table: ${table}`);
                  }
                  if (callback) return callback({ data: result, error: null });
                  return { data: result, error: null };
                } catch (error: any) {
                  if (callback) return callback({ data: null, error: error.message });
                  return { data: null, error: error.message };
                }
              }
            })
          }
        },
        delete() {
          return {
            eq: (column: string, value: any) => ({
              async then(callback?: (data: any) => any) {
                try {
                  switch(table) {
                    case 'campaigns':
                      const deleteResult = await deleteCampaign(value);
                      if (!deleteResult.success) {
                        throw new Error(deleteResult.error);
                      }
                      break;
                    default:
                      throw new Error(`Unknown table: ${table}`);
                  }
                  if (callback) return callback({ error: null });
                  return { error: null };
                } catch (error: any) {
                  if (callback) return callback({ error: error.message });
                  return { error: error.message };
                }
              }
            })
          }
        },
        insert(data: any) {
          const executeInsert = async () => {
            try {
              let result: any;
              switch(table) {
                case 'campaigns':
                  // data could be an array or object
                  const campaignData = Array.isArray(data) ? data[0] : data;
                  const createResult = await createCampaign(campaignData);
                  if (createResult.success) {
                    result = createResult.data;
                  } else {
                    throw new Error(createResult.error);
                  }
                  break;
                default:
                  throw new Error(`Unknown table: ${table}`);
              }
              return { data: result, error: null };
            } catch (error: any) {
              return { data: null, error: error.message };
            }
          };

          const thenable = {
            async then(callback?: (data: any) => any) {
              const result = await executeInsert();
              if (callback) return callback(result);
              return result;
            }
          };

          return {
            select(columns?: string) {
              return {
                ...thenable,
                single() {
                  return thenable;
                }
              }
            },
            single() {
              return thenable;
            }
          }
        }
      }
    }
  };
}
import { Send, Clock, Mail, FileText, Users, Calendar, Filter, Zap, Eye, Archive, Trash2, FolderOpen, Copy } from "lucide-react";

import { useState, useEffect } from "react";
import validator from "validator";
import { useToast } from "@/lib/toast";
import { sendEmail } from "@/actions/email";
import { createTrackingRecord } from "@/actions/email-tracking";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  body?: string; // For backward compatibility if needed, but prefer content
  sent_at: string | null;
  open_rate: number | null;
  archived?: boolean;
  status?: string;
  target_audience?: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  service_interest: string;
  status: string;
  city?: string;
  state?: string;
}

// Marketing templates - Professional email templates for landscaping business
const MARKETING_TEMPLATES = [
  { 
    id: "spring_cleanup", 
    name: "Spring Clean Up", 
    subject: "🌱 Spring Yard Cleanup Special - 20% OFF for {city} Homeowners!", 
    description: "Perfect for March/April campaigns targeting homeowners after winter.",
    body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #22C55E; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; }
        .cta-button { background: #22C55E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <img src="/imgs/Imgs_WEBP/logo.webp" alt="SocialBluePro Landscaping" width="180" style="margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
        <h1 style="margin:0; font-size: 24px;">Spring Into a Beautiful Yard! 🌸</h1>
    </div>
    <div class="content">
        <p>Hi {name},</p>
        
        <p>Winter&apos;s over and it&apos;s time to refresh your outdoor space! As spring approaches, SocialBluePro Landscaping is offering <strong>20% OFF</strong> our comprehensive Spring Clean Up services for {city} residents.</p>
        
        <div class="highlight">
            <h3>🎯 Your Spring Clean Up Package Includes:</h3>
            <ul>
                <li>Leaf & Debris Removal</li>
                <li>Lawn Aeration & Dethatching</li>
                <li>Pruning & Trimming</li>
                <li>Bed Edging & Weed Control</li>
                <li>Mulch Refresh (Optional Add-on)</li>
            </ul>
        </div>
        
        <p>Our Colorado-certified team will transform your yard in just 1-2 days, leaving you with a pristine landscape ready for spring entertaining.</p>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="https://socialbluepro.com/request?utm_source=email_marketing&utm_campaign=spring_cleanup" class="cta-button">📅 Book Your Spring Clean Up</a>
        </p>
        
        <p><strong>Limited spots available</strong> - Schedule before March 31st to secure your 20% discount!</p>
        
        <p>Best regards,<br>
        <strong>The SocialBluePro Team</strong><br>
        Colorado&apos;s Premier Landscaping Experts</p>
    </div>
    <div class="footer">
        <p>SocialBluePro Landscaping | Denver, CO | (720) 737-4607</p>
        <p><a href="https://socialbluepro.com/contact">Unsubscribe</a> | <a href="https://socialbluepro.com">Visit Website</a></p>
    </div>
</body>
</html>`
  },
  { 
    id: "snow_removal", 
    name: "Snow Removal Service", 
    subject: "❄️ Winter Storm Ready: Guaranteed Snow Removal for {city}", 
    description: "Target leads in snow-prone areas with seasonal contracts.",
    body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; }
        .cta-button { background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .guarantee { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
    </style>
</head>
<body>
    <div class="header">
        <img src="/imgs/Imgs_WEBP/logo.webp" alt="SocialBluePro Landscaping" width="180" style="margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
        <h1 style="margin:0; font-size: 24px;">Winter Weather Worries? We&apos;ve Got You Covered! ⛄</h1>
    </div>
    <div class="content">
        <p>Hello {name},</p>
        
        <p>Colorado winters can be unpredictable, but your snow removal service doesn&apos;t have to be. SocialBluePro Landscaping offers <strong>guaranteed snow removal</strong> for {city} homeowners and businesses.</p>
        
        <div class="guarantee">
            <h3>✅ Our Snow Removal Guarantee:</h3>
            <ul>
                <li><strong>4-Hour Response Time</strong> after snowfall ends</li>
                <li><strong>24/7 Monitoring</strong> of weather conditions</li>
                <li><strong>Salt & De-icing</strong> included</li>
                <li><strong>Commercial & Residential</strong> service</li>
                <li><strong>Seasonal Discounts</strong> available</li>
            </ul>
        </div>
        
        <p>Don&apos;t risk slips, falls, or being snowed in. Our professional team handles everything from light dustings to major snowstorms.</p>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="https://socialbluepro.com/request?utm_source=email_marketing&utm_campaign=snow_removal" class="cta-button">❄️ Get Your Winter Quote</a>
        </p>
        
        <p><strong>Early Bird Special:</strong> Sign a seasonal contract before November 15th and receive 15% off!</p>
        
        <p>Stay safe this winter,<br>
        <strong>SocialBluePro Snow Team</strong><br>
        Colorado&apos;s Most Reliable Snow Removal</p>
    </div>
    <div class="footer">
        <p>SocialBluePro Landscaping | Denver, CO | (720) 737-4607</p>
        <p><a href="https://socialbluepro.com/contact">Unsubscribe</a> | <a href="https://socialbluepro.com">Visit Website</a></p>
    </div>
</body>
</html>`
  },
  { 
    id: "weed_cleanup", 
    name: "Weed Control & Cleanup", 
    subject: "🚫 Take Back Your Yard! Professional Weed Removal for {city}", 
    description: "Target leads struggling with weed overgrowth and maintenance.",
    body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; }
        .cta-button { background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .solution { background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a; }
    </style>
</head>
<body>
    <div class="header">
        <img src="/imgs/Imgs_WEBP/logo.webp" alt="SocialBluePro Landscaping" width="180" style="margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
        <h1 style="margin:0; font-size: 24px;">Weed-Free Yard, Guaranteed! 🌿</h1>
    </div>
    <div class="content">
        <p>Hi {name},</p>
        
        <p>Tired of battling weeds in your {city} yard? SocialBluePro Landscaping specializes in <strong>complete weed eradication and prevention</strong> that lasts all season long.</p>
        
        <div class="solution">
            <h3>🌱 Our Comprehensive Weed Control Solution:</h3>
            <ul>
                <li><strong>Manual Weed Removal</strong> - Root and all</li>
                <li><strong>Pre-Emergent Treatment</strong> - Prevents future growth</li>
                <li><strong>Organic & Chemical Options</strong> - Pet and child safe</li>
                <li><strong>Follow-up Maintenance</strong> - Monthly check-ins</li>
                <li><strong>Landscape Restoration</strong> - Repair damaged areas</li>
            </ul>
        </div>
        
        <p>We don&apos;t just pull weeds - we solve the underlying problem to keep them from coming back. Our Colorado-certified technicians use proven methods that actually work.</p>
        
        <p><strong>Special Offer:</strong> First-time customers in {city} receive a <strong>FREE weed assessment</strong> and 25% off initial treatment!</p>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="https://socialbluepro.com/request?utm_source=email_marketing&utm_campaign=weed_cleanup" class="cta-button">🚫 Schedule Free Assessment</a>
        </p>
        
        <p>Take back your yard today!<br>
        <strong>The SocialBluePro Landscape Team</strong><br>
        Colorado&apos;s Weed Control Specialists</p>
    </div>
    <div class="footer">
        <p>SocialBluePro Landscaping | Denver, CO | (720) 737-4607</p>
        <p><a href="https://socialbluepro.com/contact">Unsubscribe</a> | <a href="https://socialbluepro.com">Visit Website</a></p>
    </div>
</body>
</html>`
  },
  { 
    id: "sod_installation", 
    name: "Sod Installation", 
    subject: "🏡 Instant Lawn Transformation! Premium Sod Installation for {city}", 
    description: "For leads interested in lawn renovation and new sod.",
    body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #059669; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; }
        .cta-button { background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .benefits { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <img src="/imgs/Imgs_WEBP/logo.webp" alt="SocialBluePro Landscaping" width="180" style="margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
        <h1 style="margin:0; font-size: 24px;">From Patchy to Perfect in One Day! 🌿</h1>
    </div>
    <div class="content">
        <p>Hello {name},</p>
        
        <p>Dreaming of a lush, green lawn in {city}? SocialBluePro Landscaping specializes in <strong>same-day sod installation</strong> that transforms your yard instantly.</p>
        
        <div class="benefits">
            <h3>✅ Why Choose Our Sod Installation:</h3>
            <ul>
                <li><strong>Colorado-Grown Sod</strong> - Perfect for our climate</li>
                <li><strong>Professional Grade</strong> - Thicker, healthier grass</li>
                <li><strong>Same-Day Installation</strong> - Enjoy your new lawn tomorrow</li>
                <li><strong>1-Year Warranty</strong> - Guaranteed to thrive</li>
                <li><strong>Free Maintenance Guide</strong> - Keep it looking perfect</li>
            </ul>
        </div>
        
        <p>We handle everything from soil prep to final watering, ensuring your new lawn establishes quickly and beautifully.</p>
        
        <p><strong>Limited Time Offer:</strong> Schedule your sod installation this month and receive <strong>FREE soil amendment and fertilization</strong> ($500 value)!</p>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="https://socialbluepro.com/request?utm_source=email_marketing&utm_campaign=sod_installation" class="cta-button">🏡 Get Instant Quote</a>
        </p>
        
        <p>Transform your outdoor space,<br>
        <strong>SocialBluePro Sod Specialists</strong><br>
        Colorado&apos;s Premier Lawn Installation</p>
    </div>
    <div class="footer">
        <p>SocialBluePro Landscaping | Denver, CO | (720) 737-4607</p>
        <p><a href="https://socialbluepro.com/contact">Unsubscribe</a> | <a href="https://socialbluepro.com">Visit Website</a></p>
    </div>
</body>
</html>`
  },
  { 
    id: "hardscaping", 
    name: "Hardscaping & Patios", 
    subject: "✨ Outdoor Oasis Awaiting! Custom Hardscaping for Your {city} Home", 
    description: "Target high-value project leads with premium outdoor living solutions.",
    body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #7c3aed; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; }
        .cta-button { background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .projects { background: #ede9fe; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <img src="/imgs/Imgs_WEBP/logo.webp" alt="SocialBluePro Landscaping" width="180" style="margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
        <h1 style="margin:0; font-size: 24px;">Create Your Dream Outdoor Living Space 🏡</h1>
    </div>
    <div class="content">
        <p>Dear {name},</p>
        
        <p>Imagine entertaining friends on a custom patio, relaxing by a fire feature, or enjoying meals in your outdoor kitchen. SocialBluePro Landscaping transforms {city} backyards into <strong>luxurious outdoor retreats</strong>.</p>
        
        <div class="projects">
            <h3>🔨 Our Hardscaping Expertise:</h3>
            <ul>
                <li><strong>Custom Patios & Walkways</strong> - Paver, stone, concrete</li>
                <li><strong>Outdoor Kitchens & Fireplaces</strong> - Full entertainment setup</li>
                <li><strong>Retaining Walls & Terraces</strong> - Functional and beautiful</li>
                <li><strong>Water Features & Lighting</strong> - Ambiance and tranquility</li>
                <li><strong>Complete Design Service</strong> - From concept to completion</li>
            </ul>
        </div>
        
        <p>As Colorado&apos;s premier hardscaping company, we combine artistic design with expert craftsmanship to create spaces you&apos;ll love for years.</p>
        
        <p><strong>Exclusive Offer:</strong> Book a design consultation and receive a <strong>3D rendering of your project</strong> ($750 value) absolutely free!</p>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="https://socialbluepro.com/request?utm_source=email_marketing&utm_campaign=hardscaping" class="cta-button">✨ Schedule Design Consultation</a>
        </p>
        
        <p>Elevate your outdoor living,<br>
        <strong>SocialBluePro Design Team</strong><br>
        Colorado&apos;s Award-Winning Hardscapers</p>
    </div>
    <div class="footer">
        <p>SocialBluePro Landscaping | Denver, CO | (720) 737-4607</p>
        <p><a href="https://socialbluepro.com/contact">Unsubscribe</a> | <a href="https://socialbluepro.com">Visit Website</a></p>
    </div>
</body>
</html>`
  },
  { 
    id: "mulch_seasonal", 
    name: "Mulch & Bed Refresh", 
    subject: "🎨 Transform Your Landscape! Seasonal Mulch Refresh for {city}", 
    description: "General landscaping service promotion with visual appeal.",
    body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; }
        .cta-button { background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .options { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <img src="/imgs/Imgs_WEBP/logo.webp" alt="SocialBluePro Landscaping" width="180" style="margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
        <h1 style="margin:0; font-size: 24px;">Instant Curb Appeal in Just Hours! 🏡</h1>
    </div>
    <div class="content">
        <p>Hi {name},</p>
        
        <p>Fresh mulch is the fastest way to give your {city} home a professional, well-maintained look. SocialBluePro Landscaping&apos;s <strong>Seasonal Mulch Refresh</strong> service delivers stunning results in just one day.</p>
        
        <div class="options">
            <h3>🌿 Premium Mulch Options:</h3>
            <ul>
                <li><strong>Hardwood Mulch</strong> - Rich, dark color that lasts</li>
                <li><strong>Cedar Mulch</strong> - Natural insect repellent, fresh scent</li>
                <li><strong>Pine Bark Nuggets</strong> - Decorative, long-lasting</li>
                <li><strong>Colored Mulch</strong> - Black, brown, or red for dramatic effect</li>
                <li><strong>Rubber Mulch</strong> - Never decomposes, great for play areas</li>
            </ul>
        </div>
        
        <p>Our team doesn&apos;t just dump mulch - we properly edge beds, remove old material, and apply weed barrier for lasting beauty.</p>
        
        <p><strong>Spring Special:</strong> Book your mulch refresh and receive <strong>FREE bed edging and weeding</strong> ($300 value)!</p>
        
        <p style="text-align: center; margin: 30px 0;">
            <a href="https://socialbluepro.com/request?utm_source=email_marketing&utm_campaign=mulch_seasonal" class="cta-button">🎨 Get Your Quote Now</a>
        </p>
        
        <p>Boost your home&apos;s value instantly!<br>
        <strong>SocialBluePro Landscape Team</strong><br>
        Colorado&apos;s Mulch & Bed Specialists</p>
    </div>
    <div class="footer">
        <p>SocialBluePro Landscaping | Denver, CO | (720) 737-4607</p>
        <p><a href="https://socialbluepro.com/contact">Unsubscribe</a> | <a href="https://socialbluepro.com">Visit Website</a></p>
    </div>
</body>
</html>`
  },
];

// Audience segments
const AUDIENCE_SEGMENTS = [
  { id: "all", name: "All Leads", filter: () => true },
  { id: "new", name: "New Leads", filter: (lead: Lead) => lead.status === "new" },
  { id: "contacted", name: "Contacted Leads", filter: (lead: Lead) => lead.status === "contacted" },
  { id: "snow", name: "Snow Removal Interest", filter: (lead: Lead) => lead.service_interest?.toLowerCase().includes("snow") },
  { id: "sod", name: "Sod Interest", filter: (lead: Lead) => lead.service_interest?.toLowerCase().includes("sod") },
  { id: "mulch", name: "Mulch Interest", filter: (lead: Lead) => lead.service_interest?.toLowerCase().includes("mulch") },
  { id: "hardscaping", name: "Hardscaping Interest", filter: (lead: Lead) => lead.service_interest?.toLowerCase().includes("hardscap") },
  { id: "colorado_springs", name: "Colorado Springs", filter: (lead: Lead) => lead.city?.toLowerCase().includes("colorado springs") || lead.city?.toLowerCase().includes("co springs") },
  { id: "denver", name: "Denver Metro", filter: (lead: Lead) => lead.city?.toLowerCase().includes("denver") },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const { addToast } = useToast();
  const supabase = createClient();
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("all");
  const [sendMethod, setSendMethod] = useState<"now" | "schedule" | "batch">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [emailsPerDay, setEmailsPerDay] = useState(100);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [audienceSize, setAudienceSize] = useState(0);
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [showTestEmail, setShowTestEmail] = useState(false);
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'archive' | 'unarchive' | 'delete' | null;
    campaign: Campaign | null;
  }>({ isOpen: false, action: null, campaign: null });

  // Debug preview rendering
  useEffect(() => {

    if (emailBody && activeTab === "preview") {

    }
  }, [emailBody, activeTab]);

   // Safe HTML rendering for preview
   const safeHtml = (html: string): string => {
     try {
       // Replace all merge tags with sample data
       let processedHtml = html.replace(/\{name\}/gi, "John Smith")
                            .replace(/\{city\}/gi, "Denver")
                            .replace(/\{state\}/gi, "Colorado")
                            .replace(/\{service\}/gi, "Landscaping");

       // Fix CSS issues: replace body selector with container selector
       // This ensures the template CSS doesn't break the preview layout
       processedHtml = processedHtml.replace(
         /body\s*\{([^}]+)\}/gi,
         '.email-body {$1}'
       );

       // Replace <body> tags with <div class="email-body">
       processedHtml = processedHtml.replace(/<body>/gi, '<div class="email-body">');
       processedHtml = processedHtml.replace(/<\/body>/gi, '</div>');
       // Remove </html> and <html> tags as they're not needed for preview
       processedHtml = processedHtml.replace(/<\/?html>/gi, '');
       // Remove <head> and </head> tags but keep the style
       processedHtml = processedHtml.replace(/<\/?head>/gi, '');

       return processedHtml;
     } catch (error) {
       console.error("Error processing HTML for preview:", error);
       return `<div class="p-4 text-red-600 bg-red-50 rounded-lg">
                 <p class="font-bold">Error rendering preview</p>
                 <p class="text-sm">${error instanceof Error ? error.message : 'Unknown error'}</p>
               </div>`;
     }
   };

   const { loading, refetch } = useRealTimePoll<{
    campaigns: Campaign[];
    leads: Lead[];
  }>({
    fetchFunction: async () => {
      const supabase = createClient();

      // Fetch campaigns
      const campaignsData = await getCampaigns(1000);
      setCampaigns(campaignsData);

      // Fetch leads for audience selection
      const leadsData = await getLeads();
      const sanitizedLeads: Lead[] = (leadsData.data || []).map((l: any) => ({
        ...l,
        service_interest: l.service_interest || "",
        city: l.city || "",
        state: l.state || ""
      }));
      setLeads(sanitizedLeads);

      // Calculate audience size for default segment
      updateAudienceSize("all", sanitizedLeads);

      return { campaigns: campaignsData, leads: sanitizedLeads };
    },
    interval: 30000,
    enabled: true,
    onSuccess: (data) => {
      setCampaigns(data.campaigns);
      setLeads(data.leads);
    },
    onError: (err) => {
      console.error("Polling error:", err);
    }
  });

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  };

   function updateAudienceSize(segmentId: string, leadsList: Lead[]) {
    const segment = AUDIENCE_SEGMENTS.find(s => s.id === segmentId);
    if (!segment) return;
    const size = leadsList.filter(segment.filter).length;
    setAudienceSize(size);
  }

  function handleTemplateSelect(templateId: string) {
    try {

      setSelectedTemplate(templateId);
      const template = MARKETING_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        setSubject(template.subject);
        setEmailBody(template.body);
        // Don't auto-switch to preview - let user choose
        // setActiveTab("preview");
      }
    } catch (error) {
      console.error("Error selecting template:", error);
      addToast("Error loading template. Please try again.", "error");
    }
  }

  function handleAudienceChange(segmentId: string) {
    setSelectedAudience(segmentId);
    updateAudienceSize(segmentId, leads);
  }

  async function handleSendTestEmail() {
    if (!testEmail.trim() || !validator.isEmail(testEmail)) {
      addToast("Please enter a valid email address", "error");
      return;
    }
    if (!subject.trim() || !emailBody.trim()) {
      addToast("Please compose your campaign first", "error");
      return;
    }

    setSendingTest(true);
    try {
      const result = await sendEmail(testEmail, subject, emailBody, true, 'marketing');
      if (result.success) {
        addToast(`✅ Test email sent to ${testEmail}! Check your inbox.`, "success");
        setTestEmail("");
        setShowTestEmail(false);
      } else {
        addToast(`❌ Failed to send test email: ${result.error}`, "error");
      }
    } catch (error) {
      addToast("❌ Failed to send test email: " + (error as Error).message, "error");
    } finally {
      setSendingTest(false);
    }
  }

  // Add tracking pixel to HTML email body
  function addTrackingPixel(body: string, trackingId: string): string {
    const trackingPixel = `<img src="${window.location.origin}/api/track/open/${trackingId}" width="1" height="1" style="display:none;" alt="" />`;

    // Insert pixel before closing body tag, or at the end if no body tag
    if (body.includes('</body>')) {
      return body.replace('</body>', `${trackingPixel}</body>`);
    }

    // If no body tag, append at the end
    return body + trackingPixel;
  }

  // Campaign Management Functions
  async function handleArchiveCampaign(campaign: Campaign) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("campaigns")
        .update({ archived: true })
        .eq("id", campaign.id);

      if (error) throw error;

      addToast("Campaign archived", "success");
      refetch();
    } catch (error) {
      console.error("Error archiving campaign:", error);
      addToast("Failed to archive campaign", "error");
    }
  }

  async function handleUnarchiveCampaign(campaign: Campaign) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("campaigns")
        .update({ archived: false })
        .eq("id", campaign.id);

      if (error) throw error;

      addToast("Campaign unarchived", "success");
      refetch();
    } catch (error) {
      console.error("Error unarchiving campaign:", error);
      addToast("Failed to unarchive campaign", "error");
    }
  }

  async function handleDeleteCampaign(campaign: Campaign) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaign.id);

      if (error) throw error;

      addToast("Campaign deleted", "success");
      refetch();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      addToast("Failed to delete campaign", "error");
    }
  }

  async function handleDuplicateCampaign(campaign: Campaign) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("campaigns")
        .insert([{
          name: `${campaign.name || campaign.subject} (Copy)`,
          subject: `${campaign.subject} (Copy)`,
          content: campaign.content || campaign.body || "",
          target_audience: campaign.target_audience || "all",
          sent_at: new Date().toISOString(),
          open_rate: 0,
          archived: false,
          status: 'draft',
        }]);

      if (error) throw error;

      addToast("Campaign duplicated", "success");
      refetch();
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      addToast("Failed to duplicate campaign", "error");
    }
  }

  function confirmAction(action: 'archive' | 'unarchive' | 'delete', campaign: Campaign) {
    setConfirmModal({
      isOpen: true,
      action,
      campaign
    });
  }

  function handleConfirmAction() {
    if (!confirmModal.campaign || !confirmModal.action) return;

    switch (confirmModal.action) {
      case 'archive':
        handleArchiveCampaign(confirmModal.campaign);
        break;
      case 'unarchive':
        handleUnarchiveCampaign(confirmModal.campaign);
        break;
      case 'delete':
        handleDeleteCampaign(confirmModal.campaign);
        break;
    }

    setConfirmModal({ isOpen: false, action: null, campaign: null });
  }

  // Replace links with tracking links
  function replaceLinksWithTracking(body: string, trackingId: string): string {
    // Regex to find href attributes
    const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
    
    return body.replace(hrefRegex, (match, url) => {
      const encodedUrl = encodeURIComponent(url);
      return `href="${window.location.origin}/api/track/click/${trackingId}?url=${encodedUrl}"`;
    });
  }

  async function handleSendCampaign() {
    // Validate
    if (!subject.trim() || !emailBody.trim()) {
      addToast("Please enter subject and email body", "error");
      return;
    }
    if (audienceSize === 0) {
      addToast("Selected audience has no leads", "error");
      return;
    }

    setSendingCampaign(true);
    try {
      const supabase = createClient();
      // Find selected audience segment
      const segment = AUDIENCE_SEGMENTS.find(s => s.id === selectedAudience);
      const filteredLeads = segment ? leads.filter(segment.filter) : leads;
      
      // Create campaign record in database
      const { data: campaignData, error } = await supabase
        .from("campaigns")
        .insert([
          {
            name: subject,
            subject,
            content: emailBody,
            target_audience: selectedAudience,
            sent_at: new Date().toISOString(),
            open_rate: 0,
            status: 'sent'
          },
        ])
        .select('id')
        .single();

      if (error) throw error;
      
      const campaignId = campaignData.id;

      // Send emails to each lead
      let sentCount = 0;
      let failCount = 0;
      
      for (const lead of filteredLeads) {
        try {
          // Replace merge tags in subject and body
          const mergedSubject = subject.replace(/{name}/gi, lead.name)
                                     .replace(/{city}/gi, lead.city || "")
                                     .replace(/{state}/gi, lead.state || "")
                                     .replace(/{service}/gi, lead.service_interest || "");
          
          const mergedBody = emailBody.replace(/{name}/gi, lead.name)
                                     .replace(/{city}/gi, lead.city || "")
                                     .replace(/{state}/gi, lead.state || "")
                                     .replace(/{service}/gi, lead.service_interest || "");
          
          // Create tracking record for this email
          const trackingResult = await createTrackingRecord({
            campaign_id: campaignId,
            lead_id: lead.id,
            recipient_email: lead.email,
            subject: mergedSubject
          });
          
          let finalBody = mergedBody;
          
          if (trackingResult.success && trackingResult.trackingId) {
            const trackingId = trackingResult.trackingId;
            
            // Add tracking pixel to HTML body
            finalBody = addTrackingPixel(finalBody, trackingId);
            
            // Replace links with tracking links
            finalBody = replaceLinksWithTracking(finalBody, trackingId);
          }
          
          const result = await sendEmail(lead.email, mergedSubject, finalBody, true, 'marketing');
          if (result.success) {
            sentCount++;
          } else {
            failCount++;
            console.error(`Failed to send to ${lead.email}: ${result.error}`);
          }
          
          // Small delay to avoid rate limiting (100ms)
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          failCount++;
          console.error(`Error sending to ${lead.email}:`, err);
        }
      }

      const message = `🎉 Campaign "${subject}" scheduled! Sent ${sentCount} emails, ${failCount} failed.`;
      addToast(message, sentCount > 0 ? "success" : "error");
      
      // Refresh campaigns list
      refetch();
      
    } catch (error) {
      addToast("❌ Failed to send campaign: " + (error as Error).message, "error");
    } finally {
      setSendingCampaign(false);
    }
   }

  function handleNewCampaign() {
    setSelectedTemplate("");
    setSubject("");
    setEmailBody("");
    setSelectedAudience("all");
    setSendMethod("now");
    setScheduleDate("");
    setEmailsPerDay(100);
    setActiveTab("compose");
    setShowTestEmail(false);
    setTestEmail("");
    addToast("✅ New campaign form cleared. Ready to create a new campaign.", "info");
  }

  // Handle case when supabase is not configured
  if (!supabase) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Database Not Configured</h1>
        <p className="text-gray-500 mt-2">Please check your Supabase environment variables.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium text-sm">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
      <PageContainer>
        <PageHeader
          title="Email Campaigns"
          description={`Reach out to your ${leads.length} leads with targeted marketing.`}
          actions={
            <button
              onClick={handleNewCampaign}
              className="bg-accent text-white px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-green-600 transition-all shadow-lg shadow-accent/20 min-h-[40px] sm:min-h-[44px] w-full md:w-auto"
            >
              <Send size={14} className="sm:w-4 sm:h-4" /> <span>New Campaign</span>
            </button>
          }
        />

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full max-w-full">
        {/* Campaign Builder */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-full min-w-0">
          <div className="bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-100 shadow-xl space-y-3 sm:space-y-4 md:space-y-6 max-w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-black tracking-tighter uppercase text-slate-900">Compose Campaign</h3>
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 sm:gap-2 text-slate-500 hover:text-slate-900 font-bold text-[10px] sm:text-xs uppercase tracking-widest"
              >
                <Filter size={12} className="sm:w-3.5 sm:h-3.5" /> {showAdvanced ? 'Simple' : 'Advanced'}
              </button>
            </div>
            
        <div className="space-y-4 sm:space-y-5 md:space-y-6 w-full max-w-full">
              {/* Template Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                  <FileText size={14} className="sm:w-4 sm:h-4" /> Templates
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
                  {MARKETING_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                       className={`p-2.5 sm:p-3 md:p-4 rounded-md sm:rounded-lg md:rounded-xl border text-left transition-all min-h-[40px] sm:min-h-[44px] ${selectedTemplate === template.id ? 'border-accent bg-accent/5' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <p className="font-bold text-slate-900 text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">{template.name}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-medium line-clamp-2">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Save 20% on Spring Clean Up!"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>

               {/* Target Audience */}
                <div>
                  <label className="block text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                    <Users size={14} className="sm:w-4 sm:h-4" /> Target Audience
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3">
                    {AUDIENCE_SEGMENTS.map(segment => (
                      <button
                        key={segment.id}
                        onClick={() => handleAudienceChange(segment.id)}
                         className={`p-2 sm:p-2.5 md:p-3 rounded-md sm:rounded-lg md:rounded-xl border text-center transition-all min-h-[40px] sm:min-h-[44px] ${selectedAudience === segment.id ? 'border-accent bg-accent/10 text-accent' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        <p className="font-bold text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">{segment.name}</p>
                         <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                           {leads.filter(segment.filter).length} leads
                         </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                  <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200">
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 sm:gap-2">
                      <Zap size={12} className="sm:w-3.5 sm:h-3.5" /> Delivery Settings
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] sm:text-xs font-bold text-slate-600">Send Method</label>
                        <select
                          value={sendMethod}
                          onChange={(e) => setSendMethod(e.target.value as "now" | "schedule" | "batch")}
                          className="w-full px-2.5 sm:px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                          <option value="now">Send Now</option>
                          <option value="schedule">Schedule</option>
                          <option value="batch">Batch Send</option>
                        </select>
                      </div>
                     
                     {sendMethod === "schedule" && (
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-600">Schedule Date</label>
                         <input
                           type="datetime-local"
                           value={scheduleDate}
                           onChange={(e) => setScheduleDate(e.target.value)}
                           className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                         />
                       </div>
                     )}
                     
                     {sendMethod === "batch" && (
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-600">Emails Per Day</label>
                         <input
                           type="range"
                           min="10"
                           max="500"
                           step="10"
                           value={emailsPerDay}
                           onChange={(e) => setEmailsPerDay(parseInt(e.target.value))}
                           className="w-full"
                         />
                         <div className="flex justify-between text-xs text-slate-500">
                           <span>Slow ({emailsPerDay}/day)</span>
                           <span className="font-bold">{emailsPerDay} emails/day</span>
                           <span>Fast</span>
                         </div>
                       </div>
                     )}
                     
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-600">Estimated Delivery</label>
                       <div className="p-3 bg-white rounded-lg border border-slate-200">
                         <p className="text-sm font-bold text-slate-900">
                           {sendMethod === "now" ? "Immediate" : 
                            sendMethod === "schedule" ? scheduleDate || "Not scheduled" :
                            `${Math.ceil(audienceSize / emailsPerDay)} days`}
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
               )}

              {/* Email Body with Tabs */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-500">Email Content</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto gap-1">
                    <button
                      onClick={() => setActiveTab("compose")}
                      className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === "compose" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      <FileText size={14} />
                      <span>Compose</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      <Eye size={14} />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => setShowTestEmail(!showTestEmail)}
                      className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 whitespace-nowrap ${showTestEmail ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      <Mail size={14} />
                      <span>Test</span>
                    </button>
                   </div>
                </div>
                
                {activeTab === "compose" ? (
               <div className="max-w-full">
                    <textarea
                      rows={10}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Write your email here... Use HTML for rich formatting."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-mono"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>Supports HTML formatting</span>
                      <span>{emailBody.length} characters</span>
                    </div>
                  </div>
                  ) : (
                     <div className="border border-slate-200 rounded-xl bg-white w-full">
                       <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                         <div className="text-sm font-bold text-slate-700">Email Preview</div>
                         <div className="text-xs text-slate-500">This is how your email will appear to recipients</div>
                       </div>
                       <div className="p-4 overflow-auto max-h-[500px] bg-slate-100">
                         {emailBody ? (
                           <div className="flex justify-center min-h-[400px]">
                              <div className="bg-white shadow-lg w-full max-w-full md:max-w-[600px]" style={{ width: '100%' }}>
                               <style>{`
                                 .email-preview-container .email-body {
                                   margin: 0 !important;
                                   padding: 0 !important;
                                   font-family: Arial, sans-serif !important;
                                   line-height: 1.6 !important;
                                   color: #333 !important;
                                   background: #fff !important;
                                 }
                                 .email-preview-container * {
                                   max-width: 100% !important;
                                   box-sizing: border-box !important;
                                 }
                                 .email-preview-container img {
                                   max-width: 100% !important;
                                   height: auto !important;
                                 }
                                 .email-preview-container table {
                                   max-width: 100% !important;
                                 }
                                 .email-preview-container .header {
                                   border-radius: 10px 10px 0 0 !important;
                                 }
                               `}</style>
                                <div
                                  className="email-preview-container"
                                  dangerouslySetInnerHTML={{ __html: safeHtml(emailBody) }}
                                />

                            </div>
                          </div>
                         ) : (
                           <div className="text-center text-slate-400 italic py-12">
                             <p>Select a template or compose an email to see preview</p>
                           </div>
                         )}
                       </div>
                       <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                         <div className="flex justify-between">
                           <span>Merge tags replaced: {"{name}"} → John Smith, {"{city}"} → Denver</span>
                           <span className="font-bold">Preview only - actual emails will use lead data</span>
                         </div>
                       </div>
                     </div>
                 )}

                {/* Test Email Panel */}
                {showTestEmail && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h4 className="text-sm font-black uppercase tracking-widest text-blue-700 mb-2 flex items-center gap-2">
                      <Mail size={16} /> Send Test Email
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="Enter email address to send test"
                        className="flex-1 px-4 py-2 rounded-lg bg-white border border-blue-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <button
                        onClick={handleSendTestEmail}
                        disabled={sendingTest || !testEmail.trim() || !validator.isEmail(testEmail)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {sendingTest ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Send Test
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      Test emails help verify formatting and links before sending to your audience.
                    </p>
                  </div>
                )}
              </div>

              {/* Send Actions */}
               <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleSendCampaign}
                  disabled={sendingCampaign || !subject.trim() || !emailBody.trim() || audienceSize === 0}
                  className="flex-1 bg-accent text-white py-3 sm:py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {sendingCampaign ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {sendMethod === "now" ? "Sending..." : 
                       sendMethod === "schedule" ? "Scheduling..." : 
                       "Starting Batch..."}
                    </>
                  ) : (
                    <>
                      <Send size={16} /> 
                      {sendMethod === "now" ? "Send Now" : 
                       sendMethod === "schedule" ? "Schedule Campaign" : 
                       "Start Batch Send"}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (sendMethod === "now") setSendMethod("schedule");
                  else if (sendMethod === "schedule") setSendMethod("batch");
                    else setSendMethod("now");
                  }}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all min-h-[44px]"
                  title={`Current: ${sendMethod}. Click to cycle: now → schedule → batch`}
                >
                  <Calendar size={20} />
                  <span className="text-xs font-bold capitalize">{sendMethod}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Stats */}
        <div className="space-y-6">
          {/* Campaign Stats */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xl">
            <h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Mail size={16} className="sm:w-[18px] sm:h-[18px]" /> Campaign Summary
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-bold text-slate-600">Selected Audience</span>
                <span className="text-sm sm:text-base font-bold text-slate-900">{AUDIENCE_SEGMENTS.find(s => s.id === selectedAudience)?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-bold text-slate-600">Total Leads</span>
                <span className="text-sm sm:text-base font-bold text-slate-900">{audienceSize} leads</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-bold text-slate-600">Delivery Method</span>
                <span className="text-sm sm:text-base font-bold text-slate-900 capitalize">{sendMethod}</span>
              </div>
              <div className="pt-3 sm:pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-bold">Ready to send to {audienceSize} leads</p>
              </div>
            </div>
          </div>

          {/* Past Campaigns */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <Clock size={16} className="sm:w-[18px] sm:h-[18px]" /> {showArchivedOnly ? 'Archived Campaigns' : 'Past Campaigns'}
              </h3>
              <button
                onClick={() => setShowArchivedOnly(!showArchivedOnly)}
                className="text-xs font-bold text-accent hover:text-green-700"
              >
                {showArchivedOnly ? 'Show Active' : 'Show Archived'}
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {campaigns
                .filter(c => showArchivedOnly ? c.archived : !c.archived)
                .map((campaign) => (
                 <div key={campaign.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {campaign.archived && <Archive size={14} className="text-slate-400 flex-shrink-0" />}
                        <p className="font-bold text-slate-900 text-sm truncate">{campaign.subject}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>{campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : 'Draft'}</span>
                        <span className="text-green-600 font-bold">{campaign.open_rate || 0}% open</span>
                        {campaign.status && (
                          <span className="text-slate-400 capitalize">{campaign.status}</span>
                        )}
                      </div>
                    </div>
                     <div className="flex items-center gap-2 flex-shrink-0">
                      {campaign.archived ? (
                        <button
                          onClick={() => confirmAction('unarchive', campaign)}
                          className="p-3 text-green-500 hover:bg-green-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Unarchive"
                        >
                          <FolderOpen size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => confirmAction('archive', campaign)}
                          className="p-3 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Archive"
                        >
                          <Archive size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicateCampaign(campaign)}
                        className="p-3 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Duplicate"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => confirmAction('delete', campaign)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {campaigns.filter(c => showArchivedOnly ? c.archived : !c.archived).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8 italic font-medium">
                  {showArchivedOnly ? 'No archived campaigns found.' : 'No campaigns sent yet.'}
                </p>
              )}
            </div>
          </div>

          {/* Seasonal Tip */}
          <div className="bg-accent/10 p-6 rounded-2xl border border-accent/20">
            <h3 className="font-black text-accent mb-2 flex items-center gap-2">
              <Zap size={18} /> Pro Tip
            </h3>
            <p className="text-sm text-slate-700 font-medium">
               Personalize subject lines with lead&apos;s name or city for 30% higher open rates. Use merge tags like {"{name}"} and {"{city}"}.
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, campaign: null })}
        onConfirm={handleConfirmAction}
        title={
          confirmModal.action === 'delete' ? 'Delete Campaign' :
          confirmModal.action === 'archive' ? 'Archive Campaign' :
          'Unarchive Campaign'
        }
        message={
          confirmModal.action === 'delete'
            ? `Are you sure you want to delete "${confirmModal.campaign?.subject}"? This action cannot be undone.`
            : `Are you sure you want to ${confirmModal.action} "${confirmModal.campaign?.subject}"?`
        }
        confirmText={confirmModal.action === 'delete' ? 'Delete' : confirmModal.action === 'archive' ? 'Archive' : 'Unarchive'}
        variant={confirmModal.action === 'delete' ? 'danger' : 'warning'}
      />

    </PageContainer>
  );
}
