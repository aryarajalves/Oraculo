FROM node:20-bookworm-slim

# Instala Python e dependências do sistema
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Cria diretório da aplicação
WORKDIR /app

# Copia arquivos de dependência do Node
COPY backend/package*.json ./backend/

# Instala dependências do Node
RUN npm --prefix backend install

# Copia requirements.txt do Python
COPY backend/requirements.txt ./backend/

# Instala dependências do Python
RUN pip3 install --break-system-packages -r backend/requirements.txt

# Copia todo o código-fonte (backend e frontend)
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Expõe a porta do dashboard backend
EXPOSE 3131

# Inicializa o servidor backend
CMD ["npm", "--prefix", "backend", "run", "dashboard"]
