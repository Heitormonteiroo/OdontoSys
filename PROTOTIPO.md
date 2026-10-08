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
    auth/  pacientes/  anamnese/  prontuario/  odontograma/  plano/  documentos/  (próximas: inicio, receitas, agenda)
  components/
    ui/                    Button, Chip, Alert, Card, Field, Select, Tabs, Modal, Avatar, Icon
    layout/                Sidebar, PrototypeBanner, PagePlaceholder
    feedback/              EmptyState, SemPermissao
    print/                 Imprimivel (folha A4 + impressão do navegador), Timbre, LinhaAssinatura
  lib/                     utilitários puros: dates, text (máscaras), permissions, status, dinheiro (centavos), hash
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
- O design da aba Plano mostra "Pago/Saldo a pagar/Registrar pagamento". Isso é controle financeiro, fora do escopo (CLAUDE.md), e foi omitido. No lugar: total do plano, aprovado e proposto.
- Ficha do paciente (todas as abas):
  - Linha do tempo: entradas append-only (o store não tem ação de editar/apagar e congela cada entrada com `Object.freeze`). Correção = adendo ligado à entrada. Hash encadeado por paciente (`hash = hash(conteúdo + hash anterior)`, simulado), conferido na tela ("Cadeia íntegra").
  - Gravam entrada na linha do tempo: evolução, adendo, cada evento do odontograma, anamnese do tablet, conclusão/cancelamento de item do plano, nova versão do plano e decisão do orçamento.
  - Exportar prontuário: folha A4 pela impressão do navegador (linha do tempo completa com autor, data e hash + odontograma atual). O PDF gerado no servidor (pdf-lib/react-pdf) fica para a etapa de documentos.
  - Odontograma: segue `design/Odontograma.dc.html` (ferramentas, existente/planejado/realizado, dentição permanente/decídua/mista, correção com motivo). Estado = projeção dos eventos (`features/odontograma/lib/estado.ts`). Dentição inicial sugerida pela idade (decisão pendente nº 17). Catálogo de achados e cores do design (decisão nº 16).
  - Plano: itens por etapa (número livre, decisão nº 19), histórico de status append-only. "Iniciar" e "Concluir" só depois do orçamento assinado. Concluir pede confirmação e gera o achado "realizado" no odontograma + entrada no prontuário. Cancelar exige motivo. Incluir item em plano aprovado cria nova versão (a anterior fica preservada e consultável).
  - Orçamento: só itens propostos; snapshot imutável com número sequencial por clínica e hash; validade padrão de 30 dias; desconto só pelo dentista (decisão nº 20). Novo orçamento substitui o que estava em aberto. "Expirado" é calculado pela validade. "Assinado"/"Recusado" registram a decisão do papel; aprovar não gera cobrança.
  - Catálogo de procedimentos e preços são exemplos fictícios (decisão nº 18). Valores sempre em centavos (inteiros).
  - Documentos: lista dos emitidos (receita, atestado, termo, orçamento, anamnese), reimpressão a partir do snapshot e anexo da cópia assinada (PDF/JPG/PNG) com hash. O arquivo não sai do navegador. "Nova receita" leva à tela provisória da etapa de receitas; atestados e termos ficam para essa etapa.
  - Imprimir a anamnese passa a registrar um documento emitido, para anexar a cópia assinada depois.
  - Recepção na aba Plano: vê tudo, emite orçamento (sem desconto) e registra assinatura/recusa; não inclui itens nem muda status. Em Documentos, anexa cópias assinadas.
  - Não simulado: `audit_log` de leituras e escritas (fica para o backend).
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
