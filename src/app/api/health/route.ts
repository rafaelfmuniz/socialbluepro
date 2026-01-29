import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const dbCheckStart = Date.now();
    await prisma.$queryRaw`SELECT 1 as health_check`;
    const dbCheckTime = Date.now() - dbCheckStart;
    
    // Get basic system info
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    // Get database stats (if available)
    let dbStats = {};
    try {
      const [userCount, leadCount, campaignCount] = await Promise.all([
        prisma.user.count(),
        prisma.lead.count(),
        prisma.campaign.count(),
      ]);
      
      dbStats = {
        users: userCount,
        leads: leadCount,
        campaigns: campaignCount,
      };
    } catch (dbStatsError) {
      // Silently fail db stats - not critical for health check
      console.warn("Could not fetch database stats:", dbStatsError);
    }
    
    const responseTime = Date.now() - startTime;
    
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks: {
        database: {
          status: "healthy",
          responseTime: `${dbCheckTime}ms`,
          connection: "established",
        },
        api: {
          status: "healthy",
          responseTime: `${responseTime}ms`,
        },
      },
      system: {
        uptime: `${Math.floor(uptime)}s`,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        },
        nodeVersion: process.version,
        platform: process.platform,
      },
      database: dbStats,
    };
    
    return NextResponse.json(healthData, { status: 200 });
    
  } catch (error) {
    console.error("Health check failed:", error);
    
    const responseTime = Date.now() - startTime;
    
    const errorData = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: "Database connection failed",
      details: String(error),
      checks: {
        database: {
          status: "unhealthy",
          error: String(error),
        },
      },
    };
    
    return NextResponse.json(errorData, { status: 503 });
    
  }
}

// Allow HEAD requests for simple health checks
export async function HEAD(request: NextRequest) {
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}