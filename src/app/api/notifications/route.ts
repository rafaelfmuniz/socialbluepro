import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leads = await prisma.lead.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      }
    });

    const emailLogs = await prisma.emailLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 3,
      select: {
        id: true,
        recipient: true,
        subject: true,
        status: true,
        created_at: true,
      }
    });

    const users = await prisma.adminUser.findMany({
      orderBy: { created_at: 'desc' },
      take: 2,
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      }
    });

    const notifications = [];

    for (const lead of leads) {
      notifications.push({
        id: `lead-${lead.id}`,
        type: 'lead',
        title: 'New Lead',
        message: `${lead.name} submitted a request`,
        time: lead.created_at.toISOString(),
        read: false,
      });
    }

    for (const log of emailLogs) {
      notifications.push({
        id: `email-${log.id}`,
        type: log.status === 'success' ? 'campaign' : 'system',
        title: log.status === 'success' ? 'Email Sent' : 'Email Failed',
        message: `${log.subject} to ${log.recipient}`,
        time: log.created_at.toISOString(),
        read: false,
      });
    }

    for (const user of users) {
      notifications.push({
        id: `user-${user.id}`,
        type: 'user',
        title: 'New User',
        message: `${user.name} joined the team`,
        time: user.created_at.toISOString(),
        read: false,
      });
    }

    notifications.sort((a, b) => 
      new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    return NextResponse.json({ 
      notifications: notifications.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      notifications: [] 
    });
  }
}
