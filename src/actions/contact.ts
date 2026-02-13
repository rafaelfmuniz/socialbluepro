"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import validator from "validator";

export async function submitContactForm(formData: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  try {
    const { name, email, phone, message } = formData;

    // Validation
    if (!name || !email || !phone || !message) {
      return { success: false, error: "All fields are required." };
    }

    if (!validator.isEmail(email)) {
      return { success: false, error: "Invalid email address." };
    }

    // Create lead in database
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        service_interest: "General Inquiry",
        description: message,
        status: "new",
        notes: "Submitted via Contact Form",
        zip_code: "00000", // Default for contact form since zip is required in model but not in contact form
      }
    });

    // Notify admins
    try {
      const admins = await prisma.adminUser.findMany({
        where: { is_active: true },
        select: { email: true }
      });

      if (admins.length > 0) {
        const adminHtml = `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><a href="https://socialbluepro.com/admin/leads">View in Admin Dashboard</a></p>
        `;

        await sendEmail({
          to: admins.map(a => a.email),
          subject: `[Contact Form] ${name}`,
          html: adminHtml,
          text: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
          purpose: "admin_notification"
        });
      }
    } catch (e) {
      console.error("[CONTACT] Admin notification failed:", e);
    }

    return { success: true, message: "Thank you for your message. We will get back to you shortly!" };
  } catch (error) {
    console.error("[CONTACT] Error submitting form:", error);
    return { success: false, error: "Failed to submit message. Please try again later." };
  }
}
