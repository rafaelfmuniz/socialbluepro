import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const GITHUB_REPO = "rafaelfmuniz/socialbluepro";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  published_at: string;
}

function getCurrentVersion(): string {
  try {
    const packageJson = readFileSync(join(process.cwd(), "package.json"), "utf-8");
    const pkg = JSON.parse(packageJson);
    return pkg.version;
  } catch {
    return process.env.NEXT_PUBLIC_VERSION || "2.3.1";
  }
}

export async function GET() {
  try {
    const currentVersion = getCurrentVersion();
    
    // Fetch latest release from GitHub
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "SocialBluePro-Version-Check",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      // If GitHub API fails, return current version without comparison
      return NextResponse.json({
        current: currentVersion,
        latest: currentVersion,
        upToDate: true,
        error: "Não foi possível verificar atualizações",
      });
    }

    const release: GitHubRelease = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, "");
    
    // Compare versions (simple semver comparison)
    const currentParts = currentVersion.split(".").map(Number);
    const latestParts = latestVersion.split(".").map(Number);
    
    let upToDate = true;
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const current = currentParts[i] || 0;
      const latest = latestParts[i] || 0;
      
      if (latest > current) {
        upToDate = false;
        break;
      } else if (current > latest) {
        break;
      }
    }

    return NextResponse.json({
      current: currentVersion,
      latest: latestVersion,
      upToDate,
      releaseUrl: release.html_url,
      publishedAt: release.published_at,
    });
  } catch (error) {
    console.error("[VERSION API] Error:", error);
    return NextResponse.json(
      {
        error: "Erro ao verificar versão",
        current: getCurrentVersion(),
      },
      { status: 500 }
    );
  }
}
