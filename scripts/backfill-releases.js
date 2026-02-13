const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");

const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

const OWNER = "rafaelfmuniz";
const REPO = "socialbluepro";

const releases = [
  {
    tag: "v2.2.0",
    name: "v2.2.0 - Local SEO Architecture",
    body: `## Local SEO Architecture v2.2.0

### Adicionado
- Arquitetura de páginas de serviço dinâmicas
- Client components otimizados para SEO: ServicePageClient.tsx
- Slugs otimizados: sod-installation, hardscaping, weed-control, etc.
- Página de solicitação de orçamento reformulada com estilo QuoteModal
- Rastreamento de leads orgânicos/diretos com source=direct
- Integração de marketing analytics ao dashboard

### Arquivos Novos
- src/app/services/[slug]/ServicePageClient.tsx

### Modificado
- src/app/admin/page.tsx
- src/actions/leads.ts`,
  },
  {
    tag: "v2.3.0",
    name: "v2.3.0 - Contact Message System & Local SEO",
    body: `## Contact Message System & Local SEO v2.3.0

### Adicionado
- Sistema completo de mensagens de contato
- Modelo ContactMessage no Prisma
- Dashboard de mensagens em /admin/messages
- Validação robusta e anti-bot no formulário de contato
- Páginas institucionais: /about, /faq
- Páginas de serviço detalhadas: /services/[slug]
- Páginas de localização: /locations/[city]
- Footer atualizado com nomes de cidades (SEO local)

### Arquivos Novos
- src/actions/contact.ts
- src/app/admin/messages/page.tsx
- src/app/admin/messages/[id]/page.tsx
- src/app/contact/page.tsx
- src/app/about/page.tsx
- src/app/faq/page.tsx
- src/app/services/page.tsx
- src/lib/locations-data.ts
- src/lib/services-data.ts

### Database
- Adicionado modelo ContactMessage ao Prisma`,
  },
  {
    tag: "v2.3.1",
    name: "v2.3.1 - Marketing Tools UX Fixes & UI Standardization",
    body: `## Marketing Tools UX Fixes & UI Standardization v2.3.1

### Corrigido
- Modal de QR Code para links da lista
- Botões de copiar URL corrigidos (builder e lista)
- Botão de download de PNG do QR Code funcional
- Ícone "Eye" substituído por "Power" para ativar/desativar links
- Responsividade de URLs melhorada com break-all e min-w-0
- Padronização visual do painel admin com PageContainer/PageHeader
- Correções de UI mobile no footer e dropdown

### Arquivos Modificados
- src/app/admin/tools/page.tsx
- src/components/admin/AdminFooter.tsx
- src/components/Footer.tsx
- src/components/Navbar.tsx

### Database
- Migration UTM fields aplicada (add_utm_fields_to_leads)`,
  },
];

async function createRelease(release: typeof releases[0]) {
  try {
    console.log(`\n📦 Criando release ${release.tag}...`);

    // Check if release already exists
    try {
      const { data: existing } = await octokit.repos.getReleaseByTag({
        owner: OWNER,
        repo: REPO,
        tag: release.tag,
      });
      console.log(`  ⚠️  Release ${release.tag} já existe: ${existing.html_url}`);
      return;
    } catch (e) {
      // Release doesn't exist, continue
    }

    // Create the release
    const { data: newRelease } = await octokit.repos.createRelease({
      owner: OWNER,
      repo: REPO,
      tag_name: release.tag,
      name: release.name,
      body: release.body,
      draft: false,
      prerelease: false,
    });

    console.log(`  ✅ Release criada: ${newRelease.html_url}`);
  } catch (error) {
    console.error(`  ❌ Erro ao criar release ${release.tag}:`, error.message);
  }
}

async function main() {
  console.log("🚀 Iniciando backfill de releases...");
  console.log(`📍 Repositório: ${OWNER}/${REPO}`);

  if (!process.env.GH_TOKEN) {
    console.error("❌ Erro: GH_TOKEN não definido!");
    console.log("💡 Defina: export GH_TOKEN=seu_token_aqui");
    process.exit(1);
  }

  for (const release of releases) {
    await createRelease(release);
  }

  console.log("\n✨ Backfill concluído!");
}

main().catch(console.error);
