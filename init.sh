#!/bin/bash

# ==============================================================================
# init.sh - Script de Inicialização e Gerenciamento do SocialBluePro
#
# Uso: ./init.sh [comando]
# Comandos: setup, dev, prod, clean, help
# ==============================================================================

PROJECT_ROOT="/opt/socialbluepro"
PID_FILE="/tmp/socialbluepro.pid"
LOG_FILE="/tmp/socialbluepro-prod.log"

# Verifica se está no diretório correto
if [ "$(pwd)" != "$PROJECT_ROOT" ]; then
    echo "⚠️ ATENÇÃO: Executando fora do diretório raiz do projeto ($PROJECT_ROOT)."
    echo "Movendo para o diretório raiz..."
    cd "$PROJECT_ROOT" || { echo "Erro: Não foi possível mudar para o diretório do projeto."; exit 1; }
fi

# Funções de suporte
check_deps() {
    if ! command -v node &> /dev/null || ! command -v npm &> /dev/null || ! command -v npx &> /dev/null; then
        echo "❌ Erro: Node.js e/ou npm/npx não estão instalados ou acessíveis."
        exit 1
    fi
}

# ------------------------------------------------------------------------------
# COMANDOS PRINCIPAIS
# ------------------------------------------------------------------------------

# 1. Configuração Inicial (Instalar deps e configurar DB)
setup() {
    check_deps
    echo "📦 Instalando dependências (npm install)..."
    npm install

    echo "⚙️ Gerando cliente Prisma..."
    npx prisma generate

    echo "💾 Sincronizando schema do banco de dados (npx prisma db push)..."
    npx prisma db push --skip-generate

    echo "✅ Setup concluído. Pronto para desenvolvimento."
}

# 2. Iniciar Modo Desenvolvimento
dev() {
    check_deps
    echo "🚀 Iniciando servidor de desenvolvimento (http://localhost:3000) com hot reload..."
    npm run dev
}

# 3. Build e Início em Produção
prod() {
    check_deps
    if [ -f "$PID_FILE" ]; then
        stop_prod
    fi
    
    echo "🏗️ Executando build de produção (npm run build)..."
    npm run build

    echo "🟢 Iniciando servidor de produção em background (logs em $LOG_FILE)..."
    nohup npm start > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    sleep 3
    if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null; then
        echo "✅ Servidor de produção iniciado com PID $(cat "$PID_FILE")."
    else
        echo "❌ Erro ao iniciar servidor de produção. Verifique $LOG_FILE."
    fi
}

# 4. Parar Servidor de Produção
stop_prod() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null; then
            echo "🛑 Parando processo de produção (PID $PID)..."
            kill $PID
            rm -f "$PID_FILE"
            echo "✅ Servidor parado."
        else
            echo "⚠️ Arquivo PID encontrado, mas processo não está rodando. Removendo $PID_FILE."
            rm -f "$PID_FILE"
        fi
    else
        echo "⚠️ Nenhum arquivo PID encontrado. Nenhum servidor de produção rodando via init.sh."
    fi
}

# 5. Limpeza de Caches e Logs
clean() {
    echo "🧹 Limpando caches (.next, tsconfig.tsbuildinfo) e logs temporários..."
    rm -rf .next tsconfig.tsbuildinfo .npm
    rm -f $LOG_FILE $PID_FILE build.log server.log next.log
    find . -type f \( -name "*.backup" -o -name "*.bak" -o -name "*.tmp" -o -name "*.temp" \) -delete
    echo "✅ Limpeza concluída."
}

# 6. Mostrar Ajuda
help_msg() {
    echo "
Uso: ./init.sh [comando]

Comandos:
  setup    Instala dependências e configura o banco de dados (Prisma).
  dev      Inicia o servidor em modo de desenvolvimento (npm run dev).
  prod     Executa o build e inicia o servidor em modo de produção.
  stop     Para o servidor de produção iniciado via 'prod'.
  clean    Remove caches, logs e arquivos temporários/backup.
  help     Mostra esta mensagem de ajuda.
"
}

# ------------------------------------------------------------------------------
# EXECUÇÃO
# ------------------------------------------------------------------------------

if [ -z "$1" ]; then
    help_msg
    exit 0
fi

case "$1" in
    setup)
        setup
        ;;
    dev)
        dev
        ;;
    prod)
        prod
        ;;
    stop)
        stop_prod
        ;;
    clean)
        clean
        ;;
    help)
        help_msg
        ;;
    *)
        echo "❌ Comando desconhecido: $1"
        help_msg
        exit 1
        ;;
esac

exit 0
