"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import validator from "validator";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import {
  validateEmailDomain,
  validateAddressFormat,
  validateColoradoCity,
  validateColoradoZipStatic
} from "@/lib/validators";
import { getRecaptchaConfig, type RecaptchaConfig } from "./settings";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: "unread" | "read";
  created_at: string;
  updated_at: string;
}

export async function submitContactForm(formData: {
  name: string;
  email: string;
  phone: string;
  message: string;
  recaptchaToken?: string;
}) {
  try {
    const { name, email, phone, message, recaptchaToken } = formData;

    // Validation: Required fields
    if (!name || !email || !phone || !message) {
      return { success: false, error: "All fields are required." };
    }

    // Name validation
    if (name.trim().length < 2) {
      return { success: false, error: "Please enter your full name (at least 2 characters)." };
    }

    // Email format validation
    if (!validator.isEmail(email)) {
      return { success: false, error: "Invalid email address." };
    }

    // Email domain validation (MX records)
    const emailValidation = await validateEmailDomain(email);
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error || "Invalid email address." };
    }

    // Phone validation - US numbers only
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

    // Additional phone validation
    const nationalNumber = phoneNumber.nationalNumber;
    const areaCode = nationalNumber.substring(0, 3);

    // Reject toll-free and premium rate numbers
    const tollFreeAreaCodes = ['800', '888', '877', '866', '855', '844', '833', '822'];
    if (tollFreeAreaCodes.includes(areaCode)) {
      return { success: false, error: "Invalid phone number." };
    }

    // Reject test numbers (555 area code)
    if (areaCode === '555') {
      return { success: false, error: "Invalid phone number." };
    }

    // Reject invalid area codes
    const validAreaCodes = [
      '201', '202', '203', '205', '206', '207', '208', '209', '210', '212', '213', '214', '215', '216', '217', '218', '219', '220', '223', '224', '225', '228', '229', '231', '234', '239', '240', '248', '251', '252', '253', '254', '256', '260', '262', '267', '269', '270', '272', '274', '276', '279', '281', '283', '301', '302', '303', '304', '305', '307', '308', '309', '310', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '323', '325', '327', '330', '331', '332', '334', '336', '337', '339', '341', '346', '347', '350', '351', '352', '360', '361', '364', '380', '385', '386', '401', '402', '404', '405', '406', '407', '408', '409', '410', '412', '413', '414', '415', '417', '419', '423', '424', '425', '430', '432', '434', '435', '440', '442', '443', '445', '447', '458', '463', '464', '469', '470', '475', '478', '479', '480', '484', '501', '502', '503', '504', '505', '507', '508', '509', '510', '512', '513', '515', '516', '517', '518', '520', '521', '522', '523', '524', '525', '526', '527', '528', '529', '530', '531', '534', '539', '540', '541', '551', '557', '559', '561', '562', '563', '564', '567', '570', '571', '572', '573', '574', '575', '577', '579', '580', '582', '585', '586', '588', '601', '602', '603', '605', '606', '607', '608', '609', '610', '612', '614', '615', '616', '617', '618', '619', '620', '623', '626', '628', '629', '630', '631', '636', '640', '641', '646', '650', '651', '656', '657', '659', '660', '661', '662', '667', '669', '670', '671', '672', '678', '679', '680', '681', '682', '684', '689', '701', '702', '703', '704', '706', '707', '708', '710', '712', '713', '714', '715', '716', '717', '718', '719', '720', '721', '724', '725', '726', '727', '731', '732', '734', '737', '740', '743', '747', '754', '757', '760', '762', '763', '765', '769', '770', '772', '773', '774', '775', '779', '781', '785', '786', '787', '801', '802', '803', '804', '805', '806', '808', '810', '812', '813', '814', '815', '816', '817', '818', '820', '826', '828', '830', '831', '832', '833', '834', '835', '838', '839', '840', '843', '845', '847', '848', '850', '854', '856', '857', '858', '859', '860', '862', '863', '864', '865', '868', '870', '872', '878', '901', '903', '904', '906', '907', '908', '909', '910', '912', '913', '914', '915', '916', '917', '918', '919', '920', '925', '928', '929', '930', '931', '934', '936', '937', '938', '940', '941', '945', '947', '949', '951', '952', '954', '956', '959', '970', '971', '972', '973', '975', '978', '979', '980', '984', '985', '989'
    ];

    if (!validAreaCodes.includes(areaCode)) {
      return { success: false, error: "Invalid phone number." };
    }

    formattedPhone = phoneNumber.format('E.164');

    // Validate CAPTCHA if enabled
    const captchaConfig: RecaptchaConfig | null = await getRecaptchaConfig();
    if (captchaConfig?.is_enabled) {
      if (!recaptchaToken) {
        return { success: false, error: "Please complete the security check." };
      }

      // Verify CAPTCHA token server-side
      const secretKey = captchaConfig.secret_key;
      const verifyUrl =
        captchaConfig.provider === 'cloudflare_turnstile'
          ? 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
          : 'https://www.google.com/recaptcha/api/siteverify';

      const verifyParams = new URLSearchParams({
        secret: secretKey,
        response: recaptchaToken,
      });

      const verifyResponse = await fetch(verifyUrl, {
        method: 'POST',
        body: verifyParams,
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        console.error("[CONTACT] CAPTCHA verification failed:", verifyData);
        return { success: false, error: "Security check failed. Please try again." };
      }
    }

    // Save to database as ContactMessage (not Lead)
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: formattedPhone,
        message: message.trim(),
        status: "unread",
      }
    });

    console.log("[CONTACT] Message saved:", contactMessage.id);

    return {
      success: true,
      data: contactMessage,
      message: "Thank you for your message. We will get back to you shortly!"
    };
  } catch (error) {
    console.error("[CONTACT] Error submitting form:", error);
    return { success: false, error: "Failed to submit message. Please try again later." };
  }
}

// Message Management Actions
export async function getContactMessages(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    const messages = await prisma.contactMessage.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    return {
      success: true,
      data: messages.map(msg => ({
        ...msg,
        created_at: msg.created_at.toISOString(),
        updated_at: msg.updated_at.toISOString(),
      }))
    };
  } catch (error) {
    console.error("[CONTACT] Error fetching messages:", error);
    return { success: false, error: "Failed to fetch messages", data: [] };
  }
}

export async function getContactMessageById(messageId: string) {
  try {
    const message = await prisma.contactMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return { success: false, error: "Message not found", data: null };
    }

    return {
      success: true,
      data: {
        ...message,
        created_at: message.created_at.toISOString(),
        updated_at: message.updated_at.toISOString(),
      }
    };
  } catch (error) {
    console.error("[CONTACT] Error fetching message:", error);
    return { success: false, error: "Failed to fetch message", data: null };
  }
}

export async function markMessageAsRead(messageId: string, isRead: boolean = true) {
  try {
    const message = await prisma.contactMessage.update({
      where: { id: messageId },
      data: {
        status: isRead ? "read" : "unread",
        updated_at: new Date(),
      }
    });

    return {
      success: true,
      data: {
        ...message,
        created_at: message.created_at.toISOString(),
        updated_at: message.updated_at.toISOString(),
      }
    };
  } catch (error) {
    console.error("[CONTACT] Error updating message status:", error);
    return { success: false, error: "Failed to update message status" };
  }
}

export async function deleteContactMessage(messageId: string) {
  try {
    await prisma.contactMessage.delete({
      where: { id: messageId }
    });

    return { success: true };
  } catch (error) {
    console.error("[CONTACT] Error deleting message:", error);
    return { success: false, error: "Failed to delete message" };
  }
}

export async function getContactMessagesCount() {
  try {
    const total = await prisma.contactMessage.count();
    const unread = await prisma.contactMessage.count({
      where: { status: "unread" }
    });

    return { success: true, data: { total, unread } };
  } catch (error) {
    console.error("[CONTACT] Error counting messages:", error);
    return { success: false, error: "Failed to count messages", data: { total: 0, unread: 0 } };
  }
}
