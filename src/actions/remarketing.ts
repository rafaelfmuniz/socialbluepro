"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export interface RemarketingSegment {
  id: string;
  name: string;
  description?: string | null;
  criteria: any;
  lead_count: number;
  created_at: string;
  updated_at: string;
}

export async function getRemarketingSegments(): Promise<RemarketingSegment[]> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    const segments = await prisma.remarketingSegment.findMany({
      orderBy: { updated_at: 'desc' }
    });

    return segments.map(segment => ({
      ...segment,
      created_at: segment.created_at.toISOString(),
      updated_at: segment.updated_at.toISOString()
    }));
  } catch (error) {
    console.error("[REMARKETING] Error fetching segments:", error);
    return [];
  }
}

export async function createRemarketingSegment(data: Omit<RemarketingSegment, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: RemarketingSegment; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    const segment = await prisma.remarketingSegment.create({
      data: {
        name: data.name,
        description: data.description,
        criteria: data.criteria,
        lead_count: data.lead_count,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return {
      success: true,
      data: {
        ...segment,
        created_at: segment.created_at.toISOString(),
        updated_at: segment.updated_at.toISOString()
      }
    };
  } catch (error) {
    console.error("[REMARKETING] Error creating segment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateRemarketingSegment(id: string, data: Partial<Omit<RemarketingSegment, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; data?: RemarketingSegment; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    const segment = await prisma.remarketingSegment.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date()
      }
    });

    return {
      success: true,
      data: {
        ...segment,
        created_at: segment.created_at.toISOString(),
        updated_at: segment.updated_at.toISOString()
      }
    };
  } catch (error) {
    console.error("[REMARKETING] Error updating segment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteRemarketingSegment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    await prisma.remarketingSegment.delete({
      where: { id }
    });

    return { success: true };
  } catch (error) {
    console.error("[REMARKETING] Error deleting segment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createCampaign(data: {
  subject: string;
  body: string;
  sent_at: string;
  open_rate: number;
  click_rate: number;
  total_recipients: number;
  total_opens: number;
  total_clicks: number;
  status: string;
  archived: boolean;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: data.subject.substring(0, 100), // Use subject as name, truncate
        subject: data.subject,
        content: data.body,
        target_audience: "remarketing",
        sent_at: new Date(data.sent_at),
        open_rate: data.open_rate,
        click_rate: data.click_rate,
        total_recipients: data.total_recipients,
        total_opens: data.total_opens,
        total_clicks: data.total_clicks,
        status: data.status,
        archived: data.archived
      }
    });

    return { success: true, data: campaign };
  } catch (error) {
    console.error("[REMARKETING] Error creating campaign:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createScheduledCampaign(data: {
  name: string;
  subject: string;
  body: string;
  audience_segment: string;
  custom_audience: Array<{ id: string; email: string }>;
  schedule_type: string;
  scheduled_at: string;
  emails_per_day: number;
  total_count: number;
  status: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    await prisma.scheduledCampaign.create({
      data: {
        name: data.name,
        subject: data.subject,
        body: data.body,
        audience_segment: data.audience_segment,
        custom_audience: data.custom_audience,
        schedule_type: data.schedule_type,
        scheduled_at: new Date(data.scheduled_at),
        emails_per_day: data.emails_per_day,
        total_count: data.total_count,
        status: data.status
      }
    });

    return { success: true };
  } catch (error) {
    console.error("[REMARKETING] Error creating scheduled campaign:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function saveRemarketingSegment(
  segmentData: Omit<RemarketingSegment, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<{ success: boolean; data?: RemarketingSegment; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    let segment;
    if (segmentData.id) {
      segment = await prisma.remarketingSegment.update({
        where: { id: segmentData.id },
        data: {
          name: segmentData.name,
          description: segmentData.description,
          criteria: segmentData.criteria,
          lead_count: segmentData.lead_count,
          updated_at: new Date()
        }
      });
    } else {
      segment = await prisma.remarketingSegment.create({
        data: {
          name: segmentData.name,
          description: segmentData.description,
          criteria: segmentData.criteria,
          lead_count: segmentData.lead_count,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }

    return {
      success: true,
      data: {
        ...segment,
        created_at: segment.created_at.toISOString(),
        updated_at: segment.updated_at.toISOString()
      }
    };
  } catch (error) {
    console.error("[REMARKETING] Error saving segment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}


