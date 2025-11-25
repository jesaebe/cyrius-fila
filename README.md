# 📌 Sistema de Gestão de Fila — JANUS Queue

Este projeto é um sistema Web para gerenciamento de filas de atendimento, permitindo a emissão de senhas por ordem de chegada e categorização por prioridade. O sistema exibe as chamadas em tempo real em um painel eletrônico, utilizando WebSockets para atualização instantânea.

Este repositório contempla uma arquitetura moderna utilizando contêineres Docker, backend em **FastAPI**, frontend em **React**, e banco de dados **PostgreSQL**.

---

## 🚀 Objetivo

Criar um sistema simples, intuitivo e escalável para ambientes de atendimento presencial, como:

- Clínicas e hospitais  
- Prefeituras e órgãos públicos  
- Bancos  
- Lojas e atendimento ao cliente  
- Suporte técnico presencial  

---

## 🧩 Funcionalidades Principais

| Funcionalidade | Status | Descrição |
|---------------|--------|-----------|
| Cadastro automático de serviços | ✔️ | Serviços padrão são criados na inicialização |
| Geração de senha | ✔️ | Senhas sequenciais por serviço (ex.: A001, C002) |
| Tipos de senha | ✔️ | Normal e Prioritária |
| Chamada de próxima senha | ✔️ | Prioriza `PRIORITY` antes de `NORMAL` |
| Painel público com atualização em tempo real | ✔️ | WebSockets exibem última senha chamada |
| Controle básico via API (REST + WebSockets) | ✔️ | Documentação disponível em `/docs` |

---

## 🏗️ Arquitetura

┌───────────────┐ WebSocket ┌───────────────────────┐
│ Backend │◄────────────────────►│ Painel de Exibição TV │
│ (FastAPI) │ └───────────────────────┘
│ │ REST API ┌───────────────────────┐
│ │◄────────────────────►│ Interface Cliente │
│ │ └───────────────────────┘
│ │ REST API ┌───────────────────────┐
│ └────────────────────►│ Painel do Atendente │
└───────▲───────┘ └───────────────────────┘
│
│ SQL
│
┌───────┴────────┐
│ PostgreSQL │
└────────────────┘


---

## 🛠️ Tecnologias Utilizadas

### 🐳 Infraestrutura e Orquestração

| Tecnologia | Versão |
|------------|--------|
| Docker Engine | 25.x |
| Docker Compose | 2.x |

---

### 🐍 Backend (API)

| Componente | Tecnologia | Versão |
|-----------|------------|--------|
| Linguagem | Python | **3.11** |
| Framework Web | FastAPI | **0.115.0** |
| Servidor | Uvicorn | **0.30.0** |
| ORM | SQLAlchemy | **2.0.30** |
| Driver PostgreSQL | psycopg2-binary | **2.9.9** |
| WebSocket | Native FastAPI support | ✔️ |

---

### 🗄️ Banco de Dados

| Componente | Versão |
|-----------|--------|
| PostgreSQL | **15** |

---

### 🎨 Frontend

| Componente | Tecnologia | Versão |
|-----------|------------|--------|
| Framework | React | **18.x** |
| Bundler | Vite | **5.x** |
| Node.js Runtime | Node | **20.x (Alpine)** |
| WebSocket Client | Nativo | ✔️ |

---

## 📦 Estrutura do Projeto

fila-system/
├─ backend/
│ ├─ app/
│ ├─ Dockerfile
│ ├─ requirements.txt
│ └─ .env
├─ frontend/
│ ├─ src/
│ ├─ Dockerfile
│ └─ package.json
├─ docker-compose.yml
└─ README.md


---

## ▶️ Como Executar

### 1️⃣ Clonar o repositório

```bash
git clone https://github.com/SEU_USUARIO/fila-system.git
cd fila-system

docker-compose build
docker-compose up -d

| Serviço                | URL                                                      |
| ---------------------- | -------------------------------------------------------- |
| Frontend               | [http://localhost:5173](http://localhost:5173)           |
| Backend Docs (Swagger) | [http://localhost:8000/docs](http://localhost:8000/docs) |
| WebSocket Painel       | ws://localhost:8000/ws/board                             |

| Ação                   | Onde executar                 |
| ---------------------- | ----------------------------- |
| Criar senha            | Página inicial                |
| Ver senha gerada       | Painel                        |
| Chamar próxima senha   | Tela do atendente             |
| Exibição em tempo real | Painel conectado ao WebSocket |
  