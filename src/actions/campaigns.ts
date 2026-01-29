"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function mapPrismaCampaignToCampaign(campaign: any): Campaign {
  return {
    id: campaign.id,
    name: campaign.name,
    subject: campaign.subject,
    content: campaign.content,
    target_audience: campaign.target_audience,
    status: campaign.status,
    sent_count: campaign.sent_count,
    opened_count: campaign.opened_count,
    clicked_count: campaign.clicked_count,
    total_recipients: campaign.total_recipients,
    total_opens: campaign.total_opens,
    total_clicks: campaign.total_clicks,
    open_rate: campaign.open_rate,
    click_rate: campaign.click_rate,
    archived: campaign.archived,
    created_by: campaign.created_by,
    admin_id: campaign.admin_id,
    created_at: campaign.created_at?.toISOString() || new Date().toISOString(),
    updated_at: campaign.updated_at?.toISOString() || new Date().toISOString(),
    sent_at: campaign.sent_at?.toISOString() || null,
  };
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  target_audience: string;
  status: string;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  total_recipients: number;
  total_opens: number;
  total_clicks: number;
  open_rate: number | null;
  click_rate: number | null;
  archived: boolean;
  created_by: string | null;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
}

export async function getCampaigns(limit: number = 50): Promise<Campaign[]> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    const campaigns = await prisma.campaign.findMany({
      orderBy: { sent_at: 'desc' },
      take: limit
    });

    return campaigns.map(mapPrismaCampaignToCampaign) || [];
  } catch (error) {
    console.error("[CAMPAIGNS] Error fetching campaigns:", error);
    return [];
  }
}

export async function getCampaignById(campaignId: string): Promise<Campaign | null> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    return campaign ? mapPrismaCampaignToCampaign(campaign) : null;
  } catch (error) {
    console.error("[CAMPAIGNS] Error fetching campaign by ID:", error);
    return null;
  }
}

export async function createCampaign(data: {
  name: string;
  subject: string;
  content: string;
  target_audience: string;
  status?: string;
  sent_at?: Date | string;
}): Promise<{ success: boolean; error?: string; data?: Campaign }> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    const sentAt = data.sent_at ? new Date(data.sent_at) : null;

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        subject: data.subject,
        content: data.content,
        target_audience: data.target_audience,
        status: data.status || 'draft',
        sent_at: sentAt,
        sent_count: 0,
        opened_count: 0,
        clicked_count: 0,
        total_recipients: 0,
        total_opens: 0,
        total_clicks: 0,
        open_rate: 0,
        click_rate: 0,
        archived: false,
        created_by: null,
        admin_id: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return { success: true, data: mapPrismaCampaignToCampaign(campaign) };
  } catch (error) {
    console.error("[CAMPAIGNS] Error creating campaign:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateCampaign(campaignId: string, data: Partial<Omit<Campaign, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; error?: string; data?: Campaign }> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    const updateData: any = {};
    
    // Mapear campos da interface para o formato Prisma
    if (data.name !== undefined) updateData.name = data.name;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.target_audience !== undefined) updateData.target_audience = data.target_audience;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.sent_at !== undefined) updateData.sent_at = data.sent_at ? new Date(data.sent_at) : null;
    if (data.sent_count !== undefined) updateData.sent_count = data.sent_count;
    if (data.opened_count !== undefined) updateData.opened_count = data.opened_count;
    if (data.clicked_count !== undefined) updateData.clicked_count = data.clicked_count;
    if (data.total_recipients !== undefined) updateData.total_recipients = data.total_recipients;
    if (data.total_opens !== undefined) updateData.total_opens = data.total_opens;
    if (data.total_clicks !== undefined) updateData.total_clicks = data.total_clicks;
    if (data.open_rate !== undefined) updateData.open_rate = data.open_rate;
    if (data.click_rate !== undefined) updateData.click_rate = data.click_rate;
    if (data.archived !== undefined) updateData.archived = data.archived;
    if (data.created_by !== undefined) updateData.created_by = data.created_by;
    if (data.admin_id !== undefined) updateData.admin_id = data.admin_id;
    
    updateData.updated_at = new Date();

    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData
    });

    return { success: true, data: mapPrismaCampaignToCampaign(campaign) };
  } catch (error) {
    console.error("[CAMPAIGNS] Error updating campaign:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    await prisma.campaign.delete({
      where: { id: campaignId }
    });

    return { success: true };
  } catch (error) {
    console.error("[CAMPAIGNS] Error deleting campaign:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
