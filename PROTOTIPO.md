# Protótipo clicável · Odonto Ipê

> PROTÓTIPO · DADOS FICTÍCIOS · NÃO USAR EM ATENDIMENTO

Este arquivo será completado ao final (como rodar, o que é simulado, o que não existe e o que falta para cada tela).

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Qualquer e-mail e senha entram; depois escolha o perfil (Dentista ou Recepção).

## Estrutura de pastas

```
src/
  app/                     só rotas (finas); cada page.tsx importa uma tela de features/
    (auth)/login
    (app)/                 área logada (sidebar + guarda de sessão)
      inicio  agenda  documentos  configuracoes
      pacientes  pacientes/novo  pacientes/[id]
      receitas/nova
  features/                uma pasta por área (ver features/README.md)
    auth/  pacientes/  (próximas: inicio, prontuario, odontograma, plano, receitas, anamnese, agenda)
  components/
    ui/                    Button, Chip, Alert, Card, Field, Select, Tabs, Modal, Avatar, Icon
    layout/                Sidebar, PrototypeBanner, PagePlaceholder
    feedback/              EmptyState, SemPermissao
  lib/                     utilitários puros: dates, text (máscaras), permissions, status
  mock/                    ÚNICA camada de dados (trocar pelo backend depois)
    types/                 tipos do domínio, um arquivo por assunto
    seed/                  dados de exemplo fictícios, um arquivo por assunto
    store/                 estado em memória (Zustand), um slice por assunto
```

## Decisões e anotações (escolhas simples tomadas sem perguntar)

- Fontes (Inter) e ícones (Material Symbols Rounded) são hospedados no próprio projeto (`@fontsource/inter` e `material-symbols`), para a demo funcionar sem internet.
- Estado só em memória (Zustand). Recarregar a página (F5) reinicia a demonstração e volta ao login.
- No login, a etapa 2 (código MFA do design) foi trocada pela escolha de perfil de demonstração.
- Tailwind 3.4 (configuração em `tailwind.config.ts`, com os tokens do design).
- Todos os dados ficam em `src/mock/` (`seed/` = dados de exemplo; `store.ts` = única porta de acesso das telas).
- Data de "hoje" fixa em 2026-10-08 (`src/lib/dates.ts`), para os dados de exemplo não envelhecerem.
- Pacientes: busca por nome (sem acento), CPF ou telefone; 12 pacientes de exemplo; 8 por página.
- CPFs de exemplo têm dígito verificador inválido de propósito. O cadastro só confere se o CPF está completo (11 dígitos), sem validar o dígito.
- Medicamentos citados nos alertas são genéricos ("Medicamento Exemplo B/C"); nenhuma dose real.
- Recepção: vê lista, cadastra paciente e acessa Plano, Documentos e Anamnese; Linha do tempo e Odontograma mostram "sem permissão". Faixa de alertas críticos continua visível para segurança.
- O design da aba Plano mostra "Pago/Saldo a pagar/Registrar pagamento". Isso é controle financeiro, fora do escopo (CLAUDE.md); será omitido na etapa do plano.
- Botão "Enviar anamnese ao tablet" (faixa de paciente novo) entra junto com a etapa do totem.
- "Nova receita" abre uma tela provisória até a etapa de receitas.
