"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

interface CreateTrackingPayload {
  campaign_id: string | null;
  lead_id: string | null;
  recipient_email: string;
  subject: string;
}

const generateTrackingId = () => {
  try {
    return randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

export async function createTrackingRecord({
  campaign_id,
  lead_id,
  recipient_email,
  subject,
}: CreateTrackingPayload): Promise<{ success: boolean; trackingId?: string; error?: string }> {
  try {
    const trackingId = generateTrackingId();

    await prisma.emailTracking.create({
      data: {
        campaign_id: campaign_id,
        lead_id: lead_id,
        recipient_email: recipient_email,
        subject: subject,
        tracking_id: trackingId,
        purpose: "campaign",
        sent_at: new Date(),
        delivery_status: "sent"
      }
    });

    return { success: true, trackingId };
  } catch (error) {
    console.error("[TRACKING] Failed to create tracking record", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function recordEmailOpen(
  trackingId: string,
  deviceType?: string,
  clientType?: string
): Promise<boolean> {
  try {
    await prisma.campaignAnalytics.update({
      where: { tracking_id: trackingId },
      data: {
        opened_at: new Date(),
        opened_count: 1,
        device_type: deviceType || null,
        client_type: clientType || null,
      }
    });

    return true;
  } catch (error) {
    console.error("[TRACKING] Failed to record open", error);
    return false;
  }
}

export async function recordEmailClick(trackingId: string): Promise<boolean> {
  try {
    await prisma.campaignAnalytics.update({
      where: { tracking_id: trackingId },
      data: {
        clicked_at: new Date(),
        click_count: 1,
      }
    });

    return true;
  } catch (error) {
    console.error("[TRACKING] Failed to record click", error);
    return false;
  }
}
