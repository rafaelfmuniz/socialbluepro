"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sendEmail } from "@/lib/mail";
import validator from "validator";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { mkdirSync, existsSync } from 'fs';
import { promises as fs } from 'fs';
import { join } from 'path';
import { 
  validateEmailDomain, 
  validateAddressFormat, 
  validateColoradoCity, 
  validateColoradoZipStatic 
} from "@/lib/validators";

export interface Attachment {
  name: string;
  url: string;
  path: string;
  size: number;
  type: string;
}

// Local upload directory
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'leads');

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Helper to delete lead attachment directory
async function deleteLeadFiles(leadId: string): Promise<void> {
  try {
    const leadDir = join(UPLOAD_DIR, leadId);
    // Security: ensure path is within UPLOAD_DIR
    if (!leadDir.startsWith(UPLOAD_DIR)) {
      console.error("Security: Attempted to delete directory outside upload base:", leadDir);
      return;
    }
    if (existsSync(leadDir)) {
      await fs.rm(leadDir, { recursive: true, force: true });
      console.log("Deleted lead attachment directory:", leadDir);
    }
  } catch (error) {
    console.error("Error deleting lead files:", error);
    // Don't throw - continue with lead deletion from database
  }
}

// NOTE: Internal validation functions (validateColoradoZip, validateEmailDomain, validateAddress) 
// have been moved to src/lib/validators.ts for centralization and better maintainability.
// We are now importing them from there.

export async function uploadLeadAttachments(files: File[], leadId?: string): Promise<{ success: boolean; files?: Attachment[]; error?: string }> {
  try {
    // Determine target directory
    const targetDir = leadId ? join(UPLOAD_DIR, leadId) : UPLOAD_DIR;
    
    // Create lead-specific directory if needed
    if (leadId && !existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = join(targetDir, fileName);

      // Write file to local disk using async fs
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(filePath, buffer);

      // Generate public URL based on structure (use API route to avoid static caching issues)
      const publicUrl = leadId ? `/api/uploads/leads/${leadId}/${fileName}` : `/api/uploads/leads/${fileName}`;

      return {
        name: file.name,
        url: publicUrl,
        path: filePath,
        size: file.size,
        type: file.type
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    return { success: true, files: uploadedFiles };

  } catch (error) {
    console.error("Upload attachments error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function captureLead(formData: {
  name: string;
  email: string;
  phone: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip_code: string;
  service_interest?: string;
  description?: string;
  notes?: string;
  attachments?: Attachment[];
  // UTM Tracking
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}) {
  try {
    const lead = await prisma.lead.create({
      data: {
        ...formData,
        attachments: (formData.attachments || []) as unknown as Prisma.InputJsonValue,
        status: "new",
      }
    });

    // Send confirmation email to lead
    try {
      const leadHtml = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your SocialBluePro Landscaping Quote Request</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; color: #333333;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); max-width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">SocialBluePro Landscaping</h1>
              <p style="color: #94a3b8; margin: 5px 0 0; font-size: 14px;">Your Quote Request Received</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #0f172a; margin: 0 0 20px; font-size: 20px;">Hi ${formData.name},</h2>

              <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                Thank you for choosing SocialBluePro Landscaping! We have received your request for <strong>${formData.service_interest}</strong>.
              </p>

              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
                <p style="margin: 0; font-size: 15px; color: #334155;">
                  <strong>Next Steps:</strong> Our team is reviewing your project details. We will confirm availability and reach out shortly to discuss your vision and refine your quote.
                </p>
              </div>

              <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                SocialBluePro Landscaping specializes in creating premium outdoor living spaces tailored to your lifestyle. We look forward to the possibility of working with you.
              </p>

              <p style="font-size: 14px; color: #64748b; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <strong>Business Hours:</strong><br>
                Monday - Friday, 8:00 AM - 6:00 PM (MT)<br>
                Phone: <a href="tel:7207374607" style="color: #64748b; text-decoration: none;">(720) 737-4607</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 12px; margin: 0 0 10px; line-height: 1.5;">
                <strong>SocialBluePro Landscaping</strong><br>
                Denver, CO
              </p>
              <p style="font-size: 12px; margin: 0;">
                <a href="https://socialbluepro.com" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Visit Website</a>
                <span style="color: #cbd5e1; margin: 0 8px;">|</span>
                <a href="https://socialbluepro.com/contact" style="color: #94a3b8; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>

        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
          &copy; ${new Date().getFullYear()} SocialBluePro Landscaping. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      const leadText = `Hi ${formData.name},

Thank you for choosing SocialBluePro Landscaping! We have received your request for ${formData.service_interest}.

Next Steps: Our team is reviewing your project details. We will confirm availability and reach out shortly to discuss your vision and refine your quote.

Business Hours:
Monday - Friday, 8:00 AM - 6:00 PM (MT)
Phone: (720) 737-4607

SocialBluePro Landscaping
Denver, CO

Visit us: https://socialbluepro.com
To unsubscribe, visit: https://socialbluepro.com/contact
      `;

      await sendEmail({
        to: formData.email,
        subject: "Your Quote Request Received - SocialBluePro Landscaping",
        html: leadHtml,
        text: leadText,
        purpose: "lead_confirmation",
      });
    } catch (e) {
      console.warn("Lead confirmation email failed:", e);
    }

    // Send notification email to admins
    try {
      const admins = await prisma.adminUser.findMany({
        where: { is_active: true },
        select: { email: true }
      });

      if (admins && admins.length > 0) {
        // Helper to safely display optional fields
        const displayField = (label: string, value?: string) => {
          if (!value) return '';
          return `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; width: 140px; color: #64748b; font-weight: 500;">${label}</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;">${value}</td>
            </tr>
          `;
        };

        const adminHtml = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New Lead Notification</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">

    <!-- Header -->
    <div style="background-color: #0f172a; padding: 24px; text-align: center;">
      <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">🚀 New Lead Received</h2>
      <p style="color: #94a3b8; margin: 5px 0 0; font-size: 14px;">A new request has been submitted via website.</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px;">

      <!-- Primary Info Card -->
      <div style="margin-bottom: 24px;">
        <h3 style="color: #0f172a; margin: 0 0 16px; font-size: 16px; border-left: 4px solid #3b82f6; padding-left: 12px;">Contact Information</h3>
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px;">
          ${displayField('Name', formData.name)}
          ${displayField('Email', `<a href="mailto:${formData.email}" style="color: #3b82f6; text-decoration: none;">${formData.email}</a>`)}
          ${displayField('Phone', `<a href="tel:${formData.phone}" style="color: #3b82f6; text-decoration: none;">${formData.phone}</a>`)}
          ${displayField('Address', formData.address_line1)}
          ${displayField('City/State', (formData.city || formData.state) ? `${formData.city || ''}, ${formData.state || ''}` : undefined)}
          ${displayField('Zip Code', formData.zip_code)}
        </table>
      </div>

      <!-- Project Details -->
      <div>
        <h3 style="color: #0f172a; margin: 0 0 16px; font-size: 16px; border-left: 4px solid #10b981; padding-left: 12px;">Project Details</h3>
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px;">
          ${displayField('Service', formData.service_interest)}
          ${displayField('Description', formData.description)}
          ${displayField('Additional Notes', formData.notes)}
        </table>
      </div>

      <!-- Action Button -->
      <div style="margin-top: 32px; text-align: center;">
        <a href="https://socialbluepro.com/admin/leads" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; transition: background-color 0.2s;">
          View Full Lead Details
        </a>
        <p style="margin-top: 16px; font-size: 12px; color: #64748b;">
          Login to dashboard to view attachments and manage status.
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
        Sent automatically by SocialBlue Pro System • ${new Date().toLocaleString('en-US', { timeZone: 'America/Denver' })}
      </p>
    </div>
  </div>
</body>
</html>
        `;

        await sendEmail({
          to: admins.map((admin) => admin.email),
          subject: `[New Lead] ${formData.name} - ${formData.service_interest}`,
          html: adminHtml,
          text: `New Lead Received\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nService: ${formData.service_interest}\n\nNotes: ${formData.notes || 'N/A'}\n\nView in Dashboard: https://socialbluepro.com/admin/leads`,
          purpose: "admin_notification",
        });
      }
    } catch (e) {
      console.warn("Admin notification email failed:", e);
    }

    return { success: true, data: lead, message: "Lead saved successfully" };
  } catch (error) {
    console.error("Lead Capture Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function captureLeadWithAttachments(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const zip = formData.get("zip") as string;
    const address_line1 = formData.get("address_line1") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const service = formData.get("service") as string;
    const description = formData.get("description") as string;
    const budget = formData.get("budget") as string;
    const timeframe = formData.get("timeframe") as string;
    const files = formData.getAll("photos") as File[];

    // Extract UTM parameters
    const utm_source = formData.get("utm_source") as string || undefined;
    const utm_medium = formData.get("utm_medium") as string || undefined;
    const utm_campaign = formData.get("utm_campaign") as string || undefined;
    const utm_term = formData.get("utm_term") as string || undefined;
    const utm_content = formData.get("utm_content") as string || undefined;

    if (!name || !email || !phone || !zip || !service) {
      return { success: false, error: "Missing required fields" };
    }

    if (!validator.isEmail(email)) {
      return { success: false, error: "Valid email address required." };
    }

    const emailValidation = await validateEmailDomain(email);
    if (!emailValidation.valid) return { success: false, error: emailValidation.error };

    let formattedPhone = phone;
    let phoneNumber;
    
    // Add +1 prefix if missing for US numbers
    let phoneToParse = phone;
    if (!phone.startsWith('+')) {
        const digits = phone.replace(/\D/g, '');
        phoneToParse = '+1' + digits;
    }
    
    phoneNumber = parsePhoneNumberFromString(phoneToParse, 'US');
    if (!phoneNumber || !phoneNumber.isValid() || phoneNumber.country !== 'US') {
        return { success: false, error: "Valid US phone number required." };
    }
    formattedPhone = phoneNumber.format('E.164');

    // 1. Static Colorado Zip Validation (Fast & Secure)
    const zipValidation = validateColoradoZipStatic(zip);
    if (!zipValidation.valid) return { success: false, error: zipValidation.error };

    // 2. Address Suffix Validation
    const addressValidation = validateAddressFormat(address_line1);
    if (!addressValidation.valid) return { success: false, error: addressValidation.error };

    // 3. City Whitelist Validation
    if (city) {
      const cityValidation = validateColoradoCity(city);
      if (!cityValidation.valid) return { success: false, error: cityValidation.error };
    }

    // First create lead with empty attachments to get lead ID
    const leadCreationResult = await captureLead({
      name, email,       phone: formattedPhone,
      address_line1, city, state, zip_code: zip,
      service_interest: service, description,
      notes: `Budget: ${budget}, Timeframe: ${timeframe}`,
      attachments: [],
      // UTM Tracking
      utm_source, utm_medium, utm_campaign, utm_term, utm_content
    });

    if (!leadCreationResult.success) {
      return leadCreationResult;
    }

    const leadId = leadCreationResult.data?.id;
    if (!leadId) {
      return { success: false, error: "Failed to create lead" };
    }

    // Upload attachments if any, using leadId for organization
    let attachments: Attachment[] = [];
    const validFiles = files.filter(f => f.size > 0);
    if (validFiles.length > 0) {
      const uploadResult = await uploadLeadAttachments(validFiles, leadId);
      if (!uploadResult.success) return { success: false, error: uploadResult.error };
      attachments = uploadResult.files || [];
      
      // Update lead with actual attachments
      try {
        await prisma.lead.update({
          where: { id: leadId },
           data: { attachments: attachments as unknown as Prisma.InputJsonValue }
         });
      } catch (error) {
        console.error("Failed to update lead with attachments:", error);
        // Continue - lead was created, emails sent, attachments uploaded
        // The lead will have empty attachments in DB but files exist on disk
        // This is a partial failure but better than failing entire request
      }
    }

    // Return lead creation result with attachments included
    return {
      ...leadCreationResult,
      data: leadCreationResult.data ? {
        ...leadCreationResult.data,
        attachments
      } : leadCreationResult.data
    };
  } catch (error) {
    console.error("Capture lead with attachments error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteLead(leadId: string) {
  try {
    // First, delete any associated attachment files
    await deleteLeadFiles(leadId);
    
    // Then delete from database
    await prisma.lead.delete({
      where: { id: leadId }
    });
    return { success: true, error: null };
  } catch (error) {
    console.error("Delete lead error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateLeadStatus(leadId: string, status: string) {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status }
    });
    return { success: true, error: null };
  } catch (error) {
    console.error("Update lead status error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function assignLead(leadId: string, userId: string | null) {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        assigned_to: userId,
        assigned_at: userId ? new Date() : null
      }
    });
    return { success: true, error: null };
  } catch (error) {
    console.error("Assign lead error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getLeads(filters?: {
  status?: string;
  limit?: number;
  offset?: number
}) {
  try {
    console.log("getLeads called with filters:", filters);
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    console.log("Prisma query where:", where);
    const leads = await prisma.lead.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0
    });

    console.log("getLeads returned", leads.length, "leads");
    
    // Serialize dates to ISO strings for React Server Components
    const serializedLeads = leads.map(lead => ({
      ...lead,
      created_at: lead.created_at.toISOString(),
      updated_at: lead.updated_at.toISOString(),
      assigned_at: lead.assigned_at ? lead.assigned_at.toISOString() : null,
      // Ensure JSON fields are properly serialized
      attachments: lead.attachments ? JSON.parse(JSON.stringify(lead.attachments)) : []
    }));

    return { success: true, data: serializedLeads };
  } catch (error) {
    console.error("Get leads error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] };
  }
}

export async function getLeadById(leadId: string) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    return { success: true, data: lead };
  } catch (error) {
    console.error("Get lead by id error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: null };
  }
}

export async function exportLeads(format: 'csv' | 'excel' = 'csv') {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { created_at: 'desc' }
    });

    if (format === 'csv') {
      const headers = ["ID", "Name", "Email", "Phone", "Zip", "Service", "Status", "Created At"];
      const rows = leads.map(l => [l.id, l.name, l.email, l.phone, l.zip_code, l.service_interest, l.status, l.created_at]);
      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      return { success: true, data: csv, filename: `leads_${new Date().toISOString().split('T')[0]}.csv` };
    }

    return { success: false, error: "Unsupported format", data: null };
  } catch (error) {
    console.error("Export leads error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: null };
  }
}
