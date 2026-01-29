"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string | null;
  content: string;
  type: 'note' | 'activity';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_email?: string;
}

  export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
    try {
      const notes = await prisma.leadNote.findMany({
        where: {
          lead_id: leadId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Transform to include author info
      const transformedNotes: LeadNote[] = notes.map(note => ({
        id: note.id,
        lead_id: note.lead_id,
        author_id: note.author_id,
        content: note.content,
        type: note.type as 'note' | 'activity',
        metadata: note.metadata as Record<string, unknown>,
        created_at: note.created_at.toISOString(),
        updated_at: note.updated_at.toISOString(),
        author_name: note.author?.name || "Unknown",
        author_email: note.author?.email || "",
      }));

      return transformedNotes;
    } catch (error) {
      console.error("Error fetching lead notes:", error);
      return [];
    }
  }

export async function addLeadNote(leadId: string, content: string, type: 'note' | 'activity' = 'note', metadata: any = {}) {
  const session = await auth();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  // Get current user ID from session (assuming email matches admin_users)
  const userEmail = session.user?.email;

  let authorId = null;

  if (userEmail) {
    try {
      const user = await prisma.adminUser.findUnique({
        where: { email: userEmail },
        select: { id: true },
      });
      if (user) {
        authorId = user.id;
      }
    } catch (userError) {
      console.error("Error fetching admin user by email:", userError);
    }
  }

  try {
    const note = await prisma.leadNote.create({
      data: {
        lead_id: leadId,
        author_id: authorId,
        content,
        type,
        metadata,
      },
    });

    return { success: true, data: note };
  } catch (error) {
    console.error("Error adding lead note:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateLeadNote(noteId: string, content: string) {
  const session = await auth();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.leadNote.update({
      where: { id: noteId },
      data: { content },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating lead note:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteLeadNote(noteId: string) {
  const session = await auth();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.leadNote.delete({
      where: { id: noteId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting lead note:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Activity logging convenience functions
export async function logLeadActivity(leadId: string, activity: string, metadata: Record<string, unknown> = {}) {
  return addLeadNote(leadId, activity, 'activity', metadata);
}