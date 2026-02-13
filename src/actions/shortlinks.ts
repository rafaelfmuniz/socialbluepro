"use server";

import { prisma } from "@/lib/prisma";

export interface ShortLink {
  id: string;
  slug: string;
  destination: string;
  created_at: Date;
  clicks: number;
  active: boolean;
}

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createShortLink(data: {
  slug: string;
  destination: string;
}): Promise<ActionResult<ShortLink>> {
  try {
    // Validate slug
    const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    if (!slug || slug.length < 2) {
      return { success: false, error: "Slug must be at least 2 characters" };
    }

    if (!data.destination) {
      return { success: false, error: "Destination URL is required" };
    }

    // Check if slug already exists
    const existing = await prisma.shortLink.findUnique({
      where: { slug }
    });

    if (existing) {
      return { success: false, error: "This slug is already in use" };
    }

    const shortLink = await prisma.shortLink.create({
      data: {
        slug,
        destination: data.destination,
        active: true
      }
    });

    return { success: true, data: shortLink };
  } catch (error) {
    console.error("[SHORTLINK] Create error:", error);
    return { success: false, error: "Failed to create short link" };
  }
}

export async function getShortLinks(): Promise<ActionResult<ShortLink[]>> {
  try {
    const links = await prisma.shortLink.findMany({
      orderBy: { created_at: 'desc' },
      take: 100
    });

    return { success: true, data: links };
  } catch (error) {
    console.error("[SHORTLINK] Get error:", error);
    return { success: false, error: "Failed to fetch short links" };
  }
}

export async function getShortLinkBySlug(slug: string): Promise<ActionResult<ShortLink>> {
  try {
    const link = await prisma.shortLink.findUnique({
      where: { slug }
    });

    if (!link) {
      return { success: false, error: "Short link not found" };
    }

    return { success: true, data: link };
  } catch (error) {
    console.error("[SHORTLINK] Get by slug error:", error);
    return { success: false, error: "Failed to fetch short link" };
  }
}

export async function incrementClicks(slug: string): Promise<void> {
  try {
    await prisma.shortLink.update({
      where: { slug },
      data: { clicks: { increment: 1 } }
    });
  } catch (error) {
    console.error("[SHORTLINK] Increment clicks error:", error);
  }
}

export async function deleteShortLink(id: string): Promise<ActionResult<void>> {
  try {
    await prisma.shortLink.delete({
      where: { id }
    });

    return { success: true };
  } catch (error) {
    console.error("[SHORTLINK] Delete error:", error);
    return { success: false, error: "Failed to delete short link" };
  }
}

export async function toggleShortLink(id: string): Promise<ActionResult<ShortLink>> {
  try {
    const link = await prisma.shortLink.findUnique({
      where: { id }
    });

    if (!link) {
      return { success: false, error: "Short link not found" };
    }

    const updated = await prisma.shortLink.update({
      where: { id },
      data: { active: !link.active }
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("[SHORTLINK] Toggle error:", error);
    return { success: false, error: "Failed to toggle short link" };
  }
}
