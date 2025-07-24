# REDIS-WEBHOOK

Este projeto implementa uma plataforma altamente escalável e resiliente para o gerenciamento de eventos via webhooks, com foco em performance, segurança e confiabilidade. Sua arquitetura foi projetada para operar com múltiplos clientes simultaneamente, suportando facilmente cenários com mais de 10 mil usuários por cliente.

Foi construída com foco na integração com sistemas como o Apache NiFi, permitindo receber, autenticar, enfileirar, reprocessar e monitorar eventos de forma desacoplada e assíncrona.

---

## Visão Geral

A arquitetura utiliza filas com BullMQ sobre Redis para garantir consistência e escalabilidade horizontal. Cada evento é tratado como uma unidade de trabalho isolada, com tratamento individual de falhas, backoff exponencial e rastreabilidade. A aplicação é modular, com autenticação forte por cliente, cache híbrido, criptografia AES-256-CBC e workers dedicados para envio e reprocessamento.

---

## Problema Resolvido

Sistemas que lidam com webhooks de múltiplas fontes enfrentam desafios como:

- Garantir entrega confiável de eventos em tempo real
- Tratar falhas externas com reprocessamento seguro
- Gerenciar autenticação de múltiplos clientes com segurança
- Escalar horizontalmente sem comprometer rastreabilidade

Este projeto aborda esses desafios com uma arquitetura orientada a eventos, filas resilientes e isolamento de escopo por cliente.

---

## Arquitetura

- **Node.js** como runtime leve e não bloqueante, ideal para manipulação intensiva de I/O assíncrono.
- **Express** com middlewares `helmet` e `compression` para segurança e performance HTTP.
- **Redis + BullMQ** para controle granular de filas, jobs, reprocessamento e limpeza programada.
- **OracleDB** para persistência dos clientes e tokens criptografados.
- **NodeCache** para caching em memória de baixa latência (com fallback no banco).
- **PM2** para gerenciamento de processos escaláveis em produção.
- **Undici** como client HTTP leve e de alta performance para envio de eventos externos, substituindo bibliotecas mais pesadas como `axios` ou `node-fetch`.

---

## Funcionalidades

- **Cadastro e controle de clientes (CRUD completo)**
  - Registro com token secreto criptografado (AES-256) e controle de ativação.
  - Consulta por CNPJ, listagem geral, atualização de status e exclusão com limpeza de cache.

- **Autenticação multi-tenant**
  - Cada cliente autentica via token Bearer com fallback seguro via OracleDB.
  - Tokens ativos são carregados na memória em tempo de inicialização e validados em tempo real.

- **Processamento de eventos**
  - Eventos recebidos via `POST /webhook` são enfileirados como jobs assíncronos.
  - Cada job recebe um identificador único sequencial (`ID-<n>`) via Redis.

- **Reprocessamento controlado**
  - Jobs que falham no destino externo (ex: Apache NiFi) são realocados para uma fila de erro com controle de tentativas e metadata de falha.
  - Jobs bem-sucedidos são registrados separadamente para rastreabilidade.

- **Agendamento e manutenção**
  - Agendamento único automático garante limpeza periódica dos jobs antigos (após 14 dias).
  - Validação evita múltiplas agendagens paralelas com marcação via Redis.

---

## Segurança

- **Criptografia** de tokens com AES-256-CBC e chave derivada via SHA256 a partir da variável `ENCRYPTION_SECRET`.
- **Middleware de autorização** com escopo diferenciado: clientes autenticados, administradores com token próprio e limitação por horário.
- **Cache seguro** de tokens e metadados em memória, com fallback e invalidação manual.
- **Validações de entrada** em todas as rotas para prevenir entradas inválidas ou maliciosas.

---

## Performance

- Workers com concorrência ajustada para até 50 jobs simultâneos.
- Backoff exponencial configurado para reenvios automáticos.
- TTL de cache de 5 minutos com fallback imediato ao OracleDB.
- Leve no uso de memória e CPU mesmo sob alto volume de eventos.
- HTTP client `undici` reduz latência e consumo de recursos comparado a alternativas tradicionais.

---

## Setup

1. Configure o arquivo `.env` com:
   - Credenciais do OracleDB (`DB_USER`, `DB_PASS`, `DB_CONNECT`)
   - Configuração do Redis
   - Token de administração (`ADMIN_TOKEN`)
   - Chave de criptografia (`ENCRYPTION_SECRET`)
   - Ajuste sua rota de envio em Routers 

2. Instale as dependências:

   ```bash
   npm install```

3. Inicie a aplicação com PM2:

   ```bash
   npm start
   ```

---

## Rotas principais

- `POST /webhook`  
  Recebe um novo evento de um cliente autenticado.

- `POST /nifi/falha/:Queue`  
  Permite reprocessar eventos que falharam na comunicação com o sistema externo.

- `POST /admin/clientes`  
  Cadastra um novo cliente e retorna o token de acesso criptografado.

- `GET /admin/clientes/:cnpj`  
  Retorna os dados de um cliente específico.

- `PATCH /admin/clientes/:cnpj?active=true|false`  
  Ativa ou desativa o cliente no sistema com base no CNPJ.

---

## Conclusão

Este projeto é uma implementação real de uma infraestrutura de integração robusta, pronta para ambientes de produção com múltiplos clientes e alto volume de tráfego. Sua arquitetura orientada a filas, uso de cache híbrido, isolamento por cliente e reprocessamento controlado o tornam ideal para aplicações de missão crítica em gateways de eventos, plataformas de automação ou integrações com Apache NiFi.

---

## Autor

Desenvolvido por **Carlos**, apaixonado por programação. Atualmente estudando Java e JavaScript com foco em frameworks como React, e pretendendo evoluir para desenvolvimento com **Golang**.
