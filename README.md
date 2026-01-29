# SocialBluePro - Produção

## ⚠️ AVISO IMPORTANTE

Este é o ambiente de **PRODUÇÃO**.

- Local: /opt/prod/app/
- NÃO edite este ambiente diretamente
- O que está rodando em produção pode estar aqui ou em outro local

## Para Atualizar Produção

1. Faça as alterações em: /root/dev/app/
2. Rode o build em: /root/dev/app/
3. Copie os arquivos necessários para: /opt/prod/app/
4. Reinicie o serviço

## Estrutura

/opt/prod/app/
    ├── src/
    ├── public/
    ├── .next/       ← Build de produção
    └── ...

## Backup

Backups temporários estão em: /root/prod-backup-YYYYMMDD-*/
