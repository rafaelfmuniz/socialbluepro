"use server";

import { prisma } from "@/lib/prisma";

export interface NotificationCounts {
  newLeads: number;
  unreadMessages: number;
  total: number;
}

export async function getNotificationCounts(): Promise<{ success: boolean; data?: NotificationCounts; error?: string }> {
  try {
    const [newLeads, unreadMessages] = await Promise.all([
      prisma.lead.count({ where: { status: "new" } }),
      prisma.contactMessage.count({ where: { status: "unread" } })
    ]);

    return {
      success: true,
      data: {
        newLeads,
        unreadMessages,
        total: newLeads + unreadMessages
      }
    };
  } catch (error) {
    console.error("[NOTIFICATIONS] Error fetching counts:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}
