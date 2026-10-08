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
    (totem)/totem/[token]  modo totem do tablet (sem sidebar e sem login do paciente)
  features/                uma pasta por área (ver features/README.md)
    auth/  pacientes/  anamnese/  (próximas: inicio, prontuario, odontograma, plano, receitas, anamnese, agenda)
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
- Anamnese / totem:
  - Não há tablet de verdade: "Enviar ao tablet" gera o link e o botão "Abrir modo totem aqui" abre o totem no mesmo navegador. Recarregar a página (F5) no totem apaga a memória e o link passa a aparecer como expirado.
  - PIN de teste para sair do totem: Dra. Helena 2580 · Dr. Marcos 1470 · Camila (recepção) 3690. Qualquer um dos três libera.
  - PIN de 4 dígitos, 3 tentativas, bloqueio de 5 min e link válido por 2 h seguem o design. A proposta do CLAUDE.md é PIN de 6 dígitos, 5 tentativas e link de ~12 h (decisão pendente nº 6); os valores ficam em `features/anamnese/lib/regras.ts`.
  - O store guarda só o "hash" do token e do PIN, com um hash simulado e não criptográfico (`lib/hash.ts`). No sistema real: sha256 do token e argon2/bcrypt do PIN, no servidor.
  - O link é de uso único: enviar as respostas marca o link como usado. Gerar um link novo revoga os anteriores não usados do mesmo paciente.
  - Se a equipe sai do totem no meio, as respostas ficam guardadas como rascunho do paciente e voltam no próximo envio.
  - Perguntas do modelo copiadas do design (modelo "Questionário de saúde" v1, provisório). O conteúdo real vem do dentista (decisão pendente nº 7).
  - Alertas críticos são derivados das respostas no envio e substituem os alertas do paciente. "Não sei" em alergia, látex, anticoagulante ou gestação também gera alerta ("Não sabe informar · confirmar").
  - Exigências a mais que o design: com "Sim" em remédios de uso diário, pelo menos um nome de remédio é obrigatório. Data de nascimento e telefones são conferidos quanto a formato.
  - Dentista e Recepção podem enviar ao tablet e marcar a anamnese como conferida.
  - "Imprimir para assinatura" usa a impressão do navegador, com linha de assinatura só no papel. O PDF de verdade fica para a etapa de documentos.
- "Nova receita" abre uma tela provisória até a etapa de receitas.
