"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function mapEmailTrackingToCampaignAnalytics(item: any): CampaignAnalytics {
  return {
    id: item.id,
    campaign_id: item.campaign_id,
    lead_id: item.lead_id,
    recipient_email: item.recipient_email,
    subject: item.subject,
    sent_at: item.sent_at?.toISOString() || new Date().toISOString(),
    opened_at: item.opened_at?.toISOString() || null,
    clicked_at: item.clicked_at?.toISOString() || null,
    tracking_id: item.tracking_id,
    delivery_status: item.delivery_status || 'sent',
    delivery_error: item.delivery_error,
    device_type: item.device_type,
    client_type: item.client_type,
  };
}

export interface CampaignAnalytics {
  id: string;
  campaign_id: string | null;
  lead_id: string | null;
  recipient_email: string;
  subject: string | null;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  tracking_id: string;
  delivery_status: string;
  delivery_error: string | null;
  device_type: string | null;
  client_type: string | null;
}

/**
 * Get campaign analytics by campaign ID
 */
export async function getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics[]> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    const data = await prisma.emailTracking.findMany({
      where: { campaign_id: campaignId },
      orderBy: { sent_at: 'desc' }
    });

    return data.map(mapEmailTrackingToCampaignAnalytics) || [];
  } catch (error) {
    console.error("[CAMPAIGN ANALYTICS] Error fetching analytics:", error);
    return [];
  }
}

/**
 * Get analytics by lead ID
 */
export async function getLeadAnalytics(leadId: string): Promise<CampaignAnalytics[]> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    const data = await prisma.emailTracking.findMany({
      where: { lead_id: leadId },
      orderBy: { sent_at: 'desc' }
    });

    return data.map(mapEmailTrackingToCampaignAnalytics) || [];
  } catch (error) {
    console.error("[LEAD ANALYTICS] Error fetching lead analytics:", error);
    return [];
  }
}

/**
 * Get overall campaign stats
 */
export async function getCampaignStats(campaignId: string): Promise<{
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
  delivered: number;
  bounced: number;
}> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    const data = await prisma.emailTracking.findMany({
      where: { campaign_id: campaignId },
      select: { opened_at: true, clicked_at: true }
    });

    const sent = data.length;
    const opened = data.filter(r => r.opened_at).length;
    const clicked = data.filter(r => r.clicked_at).length;
    const delivered = sent; // Assume all sent are delivered
    const bounced = 0; // No bounce tracking
    const openRate = sent > 0 ? (opened / sent) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

    return { sent, opened, clicked, openRate, clickRate, delivered, bounced };
  } catch (error) {
    console.error("[CAMPAIGN ANALYTICS] Error fetching stats:", error);
    return { sent: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0, delivered: 0, bounced: 0 };
  }
}

/**
 * Record email open (called via tracking pixel)
 */
export async function recordEmailOpen(trackingId: string, deviceType?: string, clientType?: string): Promise<boolean> {
  try {
    await prisma.emailTracking.update({
      where: { tracking_id: trackingId },
      data: {
        opened_at: new Date(),
      }
    });

    return true;
  } catch (error) {
    console.error("[CAMPAIGN ANALYTICS] Error recording open:", error);
    return false;
  }
}

/**
 * Record email click (called via tracking link)
 */
export async function recordEmailClick(trackingId: string): Promise<boolean> {
  try {
    await prisma.emailTracking.update({
      where: { tracking_id: trackingId },
      data: {
        clicked_at: new Date(),
      }
    });

    return true;
  } catch (error) {
    console.error("[CAMPAIGN ANALYTICS] Error recording click:", error);
    return false;
  }
}

/**
 * Update delivery status
 */
export async function updateDeliveryStatus(trackingId: string, status: string, errorMsg?: string): Promise<boolean> {
  try {
    const current = await prisma.emailTracking.findUnique({
      where: { tracking_id: trackingId }
    });

    if (!current) {
      return false;
    }

    await prisma.emailTracking.update({
      where: { tracking_id: trackingId },
      data: {
        delivery_status: status,
        delivery_error: errorMsg || null
      }
    });

    return true;
  } catch (error) {
    console.error("[CAMPAIGN ANALYTICS] Error updating delivery status:", error);
    return false;
  }
}

/**
 * Get all analytics (for admin dashboard)
 */
export async function getAllAnalytics(limit: number = 100): Promise<CampaignAnalytics[]> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    const data = await prisma.emailTracking.findMany({
      orderBy: { sent_at: 'desc' },
      take: limit
    });

    return data.map(mapEmailTrackingToCampaignAnalytics) || [];
  } catch (error) {
    console.error("[CAMPAIGN ANALYTICS] Error fetching all analytics:", error);
    return [];
  }
}

export async function updateEmailTrackingStatus(
  trackingId: string,
  status: string,
  error: string | null = null
): Promise<boolean> {
  console.log(`[EMAIL TRACKING STATUS] ${trackingId}: ${status} ${error || ""}`);
  return true;
}
