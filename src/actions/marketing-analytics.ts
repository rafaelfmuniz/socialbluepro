"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export interface SourceStats {
  source: string;
  count: number;
  percentage: number;
}

export interface MediumStats {
  medium: string;
  count: number;
  percentage: number;
}

export interface CampaignStats {
  campaign: string;
  count: number;
  source?: string;
}

export interface ShortLinkStats {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
  topLinks: Array<{
    slug: string;
    clicks: number;
    destination: string;
  }>;
}

export interface MarketingAnalytics {
  totalLeads: number;
  leadsWithSource: number;
  sourceStats: SourceStats[];
  mediumStats: MediumStats[];
  campaignStats: CampaignStats[];
  shortLinkStats: ShortLinkStats;
}

export async function getMarketingAnalytics(): Promise<MarketingAnalytics> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized access");
    }

    const leads = await prisma.lead.findMany({
      select: {
        utm_source: true,
        utm_medium: true,
        utm_campaign: true,
      },
    });

    const totalLeads = leads.length;
    const leadsWithSource = leads.filter((l) => l.utm_source).length;

    const sourceMap = new Map<string, number>();
    const mediumMap = new Map<string, number>();
    const campaignMap = new Map<string, { count: number; source?: string }>();

    leads.forEach((lead) => {
      if (lead.utm_source) {
        const count = sourceMap.get(lead.utm_source) || 0;
        sourceMap.set(lead.utm_source, count + 1);
      }
      if (lead.utm_medium) {
        const count = mediumMap.get(lead.utm_medium) || 0;
        mediumMap.set(lead.utm_medium, count + 1);
      }
      if (lead.utm_campaign) {
        const existing = campaignMap.get(lead.utm_campaign);
        campaignMap.set(lead.utm_campaign, {
          count: (existing?.count || 0) + 1,
          source: lead.utm_source || existing?.source,
        });
      }
    });

    const sourceStats: SourceStats[] = Array.from(sourceMap.entries())
      .map(([source, count]) => ({
        source,
        count,
        percentage: leadsWithSource > 0 ? Math.round((count / leadsWithSource) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const mediumStats: MediumStats[] = Array.from(mediumMap.entries())
      .map(([medium, count]) => ({
        medium,
        count,
        percentage: leadsWithSource > 0 ? Math.round((count / leadsWithSource) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const campaignStats: CampaignStats[] = Array.from(campaignMap.entries())
      .map(([campaign, data]) => ({
        campaign,
        count: data.count,
        source: data.source,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const shortLinks = await prisma.shortLink.findMany({
      orderBy: { clicks: "desc" },
      take: 5,
    });

    const shortLinkStats: ShortLinkStats = {
      totalLinks: await prisma.shortLink.count(),
      totalClicks: await prisma.shortLink.aggregate({
        _sum: { clicks: true },
      }).then((r) => r._sum.clicks || 0),
      activeLinks: await prisma.shortLink.count({ where: { active: true } }),
      topLinks: shortLinks.map((l) => ({
        slug: l.slug,
        clicks: l.clicks,
        destination: l.destination,
      })),
    };

    return {
      totalLeads,
      leadsWithSource,
      sourceStats,
      mediumStats,
      campaignStats,
      shortLinkStats,
    };
  } catch (error) {
    console.error("[MARKETING ANALYTICS] Error:", error);
    return {
      totalLeads: 0,
      leadsWithSource: 0,
      sourceStats: [],
      mediumStats: [],
      campaignStats: [],
      shortLinkStats: {
        totalLinks: 0,
        totalClicks: 0,
        activeLinks: 0,
        topLinks: [],
      },
    };
  }
}
