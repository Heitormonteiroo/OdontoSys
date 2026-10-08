# Sistema de apoio ao atendimento para clínica odontológica

Software web para agilizar o atendimento de uma clínica odontológica: registro clínico, anamnese em totem, prescrições, documentos prontos para impressão e agenda.

Legenda usada neste arquivo:
- **[DECIDIDO]**: decisão do responsável pelo projeto. Não contrarie.
- **[PROPOSTA]**: sugestão ainda não confirmada. Pergunte antes de tratar como definitiva.
- **[A DEFINIR]**: falta decisão. Não assuma nada; pergunte.

## 1. Stack

- **[DECIDIDO]** Banco, autenticação e storage: Supabase (Postgres, Auth, Storage, RLS).
- **[DECIDIDO]** Hospedagem: Vercel.
- **[DECIDIDO]** Front: Next.js (App Router) + TypeScript estrito + Tailwind.
- **[DECIDIDO]** Back: serviço Node separado em `backend/` (Express ou Fastify: **[A DEFINIR]**), com a mesma divisão em módulos do front. Estrutura na seção 9.
- **[PROPOSTA]** Validação com Zod em toda entrada de API.
- **[PROPOSTA]** Camada de dados: migrations SQL puras via Supabase CLI + supabase-js com tipos gerados (sem ORM, para não conflitar com RLS).
- **[DECIDIDO]** PDF: PDFKit ou `pdf-lib`, gerado no backend, com os moldes escritos em TypeScript. Não usar Puppeteer nem moldes HTML/EJS.
- **[PROPOSTA]** Região: Supabase em São Paulo (sa-east-1) e funções da Vercel em `gru1`.
- Dados reais de pacientes só entram em plano pago (Supabase Pro e Vercel Pro). Plano free apenas com dados fictícios.

## 2. Escopo

### Dentro do escopo [DECIDIDO]
1. **Pacientes e prontuário:** cadastro de pacientes e histórico clínico em linha do tempo imutável (adendos em vez de edição).
2. **Anamnese em totem:** link de uso único, tablet travado no formulário, PIN do médico para desbloquear.
3. **Anamnese dinâmica:** respostas em JSONB, com versão do modelo.
4. **Medicamentos:** banco com apresentações (forma e concentração) e favoritos no topo.
5. **Calculadora pediátrica:** cálculo por peso, alertas de dose máxima e confirmação do médico.
6. **Documentos:** receitas, atestados e termos em PDF a partir de modelos pré-prontos.
7. **Agenda:** agenda interna e integração com o Google Calendar.
8. **Odontograma.**
9. **Plano de tratamento.**
10. **Orçamento.**

Os itens 8 a 10 foram incluídos no escopo. Os detalhes de implementação estão nas seções 4, 5 e 6, marcados como **[PROPOSTA]** até confirmação.

### Fora do escopo [DECIDIDO]
- Assinatura digital ICP-Brasil.
- Prontuário eletrônico "oficial" com validade jurídica plena.

### Fora do escopo por enquanto [PROPOSTA, confirmar]
Controle financeiro (cobrança, parcelas, contas a receber), imagens e radiografias, convênios (TISS), lembretes por WhatsApp.

## 3. Decisões de produto [DECIDIDO]

- **Prontuário = apoio ao atendimento.** Em telas, textos, contratos e documentação, use "apoio ao atendimento" ou "registro clínico auxiliar". Nunca escreva "prontuário eletrônico oficial" nem "com validade jurídica". A guarda do prontuário oficial é responsabilidade da clínica.
- **Documentos são para imprimir e assinar à mão.** O sistema só gera o PDF. Não implementar assinatura digital.
- **Antimicrobianos:** gerar duas vias do documento, identificadas no rodapé ("1ª via: farmácia" e "2ª via: paciente"), com conteúdo idêntico. O dentista assina as duas.
- **Controlados** (exigem receituário especial): o sistema exibe aviso e **não gera PDF**.
- **Exportação do prontuário:** botão que gera PDF da linha do tempo completa (com adendos, autor, data e hash) para a clínica imprimir, assinar e arquivar.

## 4. Regras invioláveis de implementação

### Dados e segurança
- Toda tabela de negócio tem `clinic_id` e **RLS ativa**. Nenhuma tabela sem política.
- Service role key **só no servidor**. Nunca no client, nunca no repositório.
- Nenhum dado clínico em logs, mensagens de erro, URLs ou títulos de eventos do Google Calendar.
- Segredos em variáveis de ambiente. Nada de segredo no código.
- Toda ação de leitura ou escrita sobre dado clínico gera registro em `audit_log`.

### Prontuário imutável
- Tabela append-only (`clinical_entries`). **Sem UPDATE e sem DELETE**, bloqueados no banco (REVOKE e trigger que lança exceção), não apenas no app.
- Correção é um **adendo** que referencia a entrada original (`parent_entry_id`).
- Hash encadeado por entrada: `hash = sha256(conteúdo + hash_anterior)`.

### Anamnese e totem
- Link de uso único: guardar apenas o **hash** do token, com `expires_at` e `used_at`. Uso único garantido por `UPDATE ... WHERE used_at IS NULL RETURNING`.
- O paciente **não usa Supabase Auth**. Uma rota no servidor valida o token e grava somente aquela anamnese. Nunca abrir RLS anônima.
- PIN do médico: hash com argon2 ou bcrypt, verificação no servidor, limite de tentativas e bloqueio temporário.
- O travamento real do tablet vem do sistema operacional (modo quiosque ou acesso guiado). O app não deve prometer segurança que só o navegador não entrega.
- Modelos de anamnese são versionados. **Versão publicada nunca é alterada**: mudança gera versão nova. Respostas guardam o `template_version`.
- Validar `answers` contra o schema no servidor.
- Alertas críticos (alergia, anticoagulante, gestante) são campos tipados e destacados, não ficam escondidos no JSONB.

### Medicamentos e calculadora pediátrica
- Apresentações com forma, concentração e unidade. Favoritos por profissional.
- Campo `controle_especial` (`nenhum`, `antimicrobiano`, `controlado`).
- Dose por apresentação: `mg_per_kg_dose`, `max_mg_per_dose`, `max_mg_per_day`. Cálculo em **decimal exato**, nunca float.
- Fluxo obrigatório: calcular, alertar se exceder o máximo, exigir **confirmação explícita** do profissional, registrar valor calculado, valor confirmado e autor.
- Toda dose exibe a **fonte** (referência bibliográfica ou revisor). A calculadora é ferramenta de apoio, nunca decide sozinha.

### Documentos
- Modelos versionados com variáveis (`{{paciente}}`, `{{data}}`, `{{profissional}}`, `{{cro}}`, `{{medicamentos}}`).
- Documento emitido guarda **snapshot do conteúdo**, número sequencial por clínica e tipo, e hash do arquivo. Editar o modelo depois não altera documentos já emitidos.
- Layout A4 (A5 opcional para receita), com timbre, nome e CRO do dentista e linha de assinatura.
- PDFs em bucket privado, com URL assinada de curta duração.
- Termos assinados no papel são escaneados e anexados ao prontuário, com hash.

### Odontograma [PROPOSTA]
- Notação FDI: dentes permanentes 11 a 48 e decíduos 51 a 85. Faces: oclusal/incisal, mesial, distal, vestibular e lingual/palatina.
- Suportar dentição permanente, decídua e mista.
- O estado do odontograma é **derivado de eventos append-only** (`tooth_events`: paciente, dente, face, tipo de achado, situação `existente`, `planejado` ou `realizado`, autor, data). Sem UPDATE e sem DELETE. Correção é um novo evento que anula o anterior, referenciando-o.
- Estado atual = projeção (view) dos eventos. O histórico completo continua consultável.
- Cada evento aparece na linha do tempo do prontuário e no `audit_log`. O odontograma atual entra na exportação do prontuário em PDF.
- Catálogo de achados (`finding_types`) configurável, com símbolos e cores definidos com o dentista.
- Componente SVG interativo, utilizável em tablet e computador.

### Plano de tratamento [PROPOSTA]
- Plano por paciente. Cada item liga um procedimento do catálogo (`procedures`) a dente e face (quando aplicável), com número de etapa.
- Status do item: `proposto`, `aprovado`, `em_andamento`, `concluido`, `cancelado`. Mudanças de status ficam em histórico append-only (`plan_item_events`).
- Item concluído, **com confirmação do dentista**, gera o achado `realizado` no odontograma e uma entrada no prontuário.
- Alterar um plano já aprovado cria uma nova versão. A anterior é preservada.
- O catálogo de procedimentos e os preços são fornecidos pela clínica. Sem preços padrão embutidos no sistema.

### Orçamento [PROPOSTA]
- Gerado a partir dos itens do plano. Guarda **snapshot** de procedimento, dente e valor.
- Valores monetários em centavos (inteiro) ou decimal exato. Nunca float.
- Número sequencial por clínica, validade configurável, desconto e condições de pagamento em texto livre.
- Status: `rascunho`, `emitido`, `aprovado`, `recusado`, `expirado`.
- Documento para **imprimir e assinar**, como os demais. O paciente assina no papel e a recepção escaneia e anexa. A aprovação é registrada no sistema por usuário autorizado.
- Orçamento emitido é imutável (snapshot e hash, reaproveitando `issued_documents`). Alteração gera um novo orçamento que substitui o anterior.
- **Não é controle financeiro.** Aprovar um orçamento não gera cobrança, parcela nem contas a receber.

### Agenda
- A agenda interna é a **fonte da verdade**.
- Primeira entrega: envio unidirecional para o Google Calendar.
- Sincronização bidirecional só na fase 6 (webhooks, renovação de canais, `syncToken`).

## 5. Decisões pendentes

Não assuma estes itens. Pergunte ao responsável antes de implementar a parte afetada.

| # | Decisão | Proposta | Bloqueia |
|---|---|---|---|
| 1 | Produto para várias clínicas ou sistema de uma só | Multi-clínica desde o início (`clinic_id`) | Fase 1 |
| 2 | Perfis e permissões | Dentista, recepção e admin. Recepção sem acesso ao prontuário clínico | Fase 1 |
| 3 | Autenticação | E-mail e senha, MFA obrigatório para profissionais | Fase 1 |
| 4 | Cadastro do paciente | Campos mínimos, CPF opcional, responsável legal para menores | Fase 1 |
| 5 | Tablet do totem | Android em modo quiosque ou iPad com acesso guiado (depende do que a clínica tem) | Fase 2 |
| 6 | PIN e validade do link | PIN por dentista de 6 dígitos, bloqueio após 5 erros, link curto (ex.: 12 h) | Fase 2 |
| 7 | Conteúdo do modelo inicial de anamnese | Fornecido pelo dentista da clínica piloto | Fase 2 |
| 8 | Base de medicamentos | Lista curada de uso odontológico, e não a base CMED inteira | Fase 4 |
| 9 | Texto dos modelos de receita, atestado e termos | Redigido pelo dentista, revisado por advogado | Fase 4 |
| 10 | Dados da clínica nos documentos | Logo, timbre, CRO, endereço configuráveis por clínica | Fase 4 |
| 11 | Fonte e validação das doses pediátricas | Referência bibliográfica citada, revisada por um dentista antes de uso | Fase 6 |
| 12 | Agenda | Profissionais e cadeiras, duração padrão, uma conta Google por profissional | Fase 7 |
| 13 | Autorização OAuth do Google | Verificar exigências de verificação do app antes de produção | Fase 7 |
| 14 | Retenção e exportação | Guarda mínima de 20 anos e rotina de exportação | Antes do piloto |
| 15 | Contrato e LGPD | Clínica como controladora, termos de uso com cláusula de apoio ao atendimento | Antes do piloto |
| 16 | Símbolos e cores do odontograma | Catálogo de achados fornecido pelo dentista da clínica piloto | Fase 3 |
| 17 | Tipos de dentição | Permanente, decídua e mista desde o início | Fase 3 |
| 18 | Catálogo de procedimentos e tabela de preços | Fornecidos pela clínica, sem códigos TUSS no início | Fase 5 |
| 19 | Etapas do plano de tratamento | Número de etapa livre por item | Fase 5 |
| 20 | Regras do orçamento | Validade padrão configurável (ex.: 30 dias), desconto só pelo dentista, condições de pagamento em texto livre | Fase 5 |
| 21 | Regras sobre orçamento e honorários | Validar com o CRO-MS e um advogado | Antes do piloto |
| 22 | Framework do backend | Express ou Fastify (os dois rodam na Vercel como função) | Fase 1 |

## 6. Modelo de dados (rascunho [PROPOSTA])

- `clinics`, `profiles` (usuário, clínica, papel), `patients`
- `clinical_entries` (append-only), `audit_log`
- `anamnesis_templates` (versão, schema), `anamnesis_links`, `anamnesis_responses`
- `medications`, `presentations`, `favorites`, `dose_rules`
- `document_templates` (versão), `issued_documents` (snapshot, número, hash, `pdf_path`)
- `finding_types`, `tooth_events` (append-only)
- `procedures`, `treatment_plans`, `treatment_plan_items`, `plan_item_events` (append-only)
- `quotes`, `quote_items`
- `appointments`, `google_sync_state`

## 7. Fases e critério de pronto

| Fase | Entrega | Critério de pronto |
|---|---|---|
| 1 | Auth, clínicas, perfis, pacientes, prontuário imutável, audit log | Impossível editar ou apagar entrada via API |
| 2 | Anamnese dinâmica e totem | Link usado uma vez, PIN funcionando, versão registrada |
| 3 | Odontograma | Achados por dente e face registrados como eventos, estado atual correto e histórico preservado |
| 4 | Medicamentos, receitas, atestados e termos em PDF | Receita emitida em menos de 1 minuto |
| 5 | Plano de tratamento e orçamento | Orçamento em PDF gerado a partir do plano, com valores corretos |
| 6 | Calculadora pediátrica | Alerta de dose máxima testado com casos reais |
| 7 | Agenda interna e envio ao Google | Consulta criada aparece no Google |
| 8 | Sincronização bidirecional e relatórios | Conflitos tratados |

A ordem das fases 3 a 8 é **[PROPOSTA]**. Meta: colocar as fases 1 a 4 em uso na clínica piloto antes de começar a fase 5, e decidir as fases 6 a 8 com base no uso real.

## 8. Como trabalhar neste repositório

1. Uma fase por vez. Não antecipe funcionalidades de fases futuras.
2. Ordem dentro de cada fase: **esquema do banco e RLS primeiro, depois API, depois telas**.
3. Escreva testes junto com o código. Obrigatórios: testes de RLS (usuário da clínica A nunca acessa dados da clínica B), imutabilidade do prontuário, uso único do token, cálculo de dose, estado do odontograma derivado dos eventos e valores do orçamento.
4. Antes de concluir qualquer tarefa que toque dado clínico, revise segurança: política de RLS, validação de entrada, ausência de dado sensível em log.
5. Se um requisito estiver ambíguo ou for **[A DEFINIR]**, pergunte em vez de assumir.
6. Não adicione funcionalidade fora do escopo sem aprovação.
7. Texto de interface em português do Brasil. Fuso horário guardado em UTC e exibido no fuso da clínica.
8. Mensagens de commit curtas e descritivas.

## 9. Estrutura de pastas [DECIDIDO]

Front e back divididos pelos mesmos módulos de negócio. Não crie pastas fora deste molde sem perguntar.

### Front (raiz do repositório, Next.js)

```
src/
├── app/            # Rotas do Next (exigidas pelo App Router). Arquivos finos: só importam uma página de modules/
├── assets/         # Imagens genéricas, ícones (criar quando houver)
├── components/     # UI global: ui/ (Button, Field, Modal…), feedback/, print/ (folha A4 de impressão)
├── config/         # Cliente do Supabase e do HTTP para o backend (criar na Fase 1)
├── hooks/          # Hooks globais: useAuth (sessão, usuários), useClinica
├── layouts/        # Estrutura visual de página: Sidebar, banners
├── modules/        # O coração do sistema, dividido por negócio
│   ├── auth/
│   ├── pacientes/      # Lista, cadastro, ficha; componentes de prontuário, anamnese/totem, odontograma, plano de tratamento
│   ├── orcamentos/     # Orçamento gerado a partir do plano (NÃO é controle financeiro)
│   ├── documentos/     # Documentos emitidos; receitas, atestados, termos; utils/ com a calculadora de dose pediátrica
│   └── agenda/
│       (cada módulo: pages/, components/, utils/ e services.ts)
├── utils/          # Funções globais: datas, máscaras (CPF, telefone), dinheiro em centavos, permissões
└── mock/           # Só no protótipo: dados fictícios em memória, usados apenas pelos services.ts e hooks/
```

- Não existe `routes/`: no Next as rotas são as pastas de `src/app/`.
- `services.ts` é a **única porta de dados** de cada módulo. Telas e componentes nunca importam `mock/`, `config/` ou o cliente do Supabase direto. Hoje os services leem o `mock/`; na Fase 1 passam a chamar o backend.
- `utils/` (global e de cada módulo) só tem funções puras, sem React e sem acesso a dados.
- Um módulo pode usar componentes, utils e services de outro (ex.: a aba Plano, em `pacientes`, usa `orcamentos/components`).

### Back (`backend/`, criado na Fase 1)

```
backend/src/
├── config/         # Conexão com Supabase/PostgreSQL, variáveis de ambiente
├── middlewares/    # Autenticação, verificação do PIN do dentista, limite de tentativas
├── modules/        # Mesma divisão do front
│   ├── agenda/
│   │   ├── controllers/
│   │   ├── routes.ts
│   │   └── services/    # Integração com a API do Google Calendar
│   ├── pacientes/
│   │   ├── controllers/
│   │   ├── routes.ts
│   │   └── services/    # Imutabilidade do prontuário (adendo em vez de UPDATE), odontograma, plano, token do totem
│   ├── orcamentos/
│   │   ├── controllers/
│   │   ├── routes.ts
│   │   └── services/    # Snapshot, número sequencial e hash do orçamento
│   └── documentos/
│       ├── controllers/
│       ├── routes.ts
│       ├── templates/   # Moldes dos PDFs em TypeScript (PDFKit/pdf-lib), versionados
│       └── services/    # Geração do PDF e envio ao Storage privado
└── server.ts       # Ponto de entrada (Express ou Fastify: [A DEFINIR])
```

- As regras de segurança da seção 4 continuam valendo no banco (RLS, REVOKE, triggers). O backend não substitui a RLS.
- Service role key só em `backend/src/config/`, lida de variável de ambiente.
- Rotas do totem não usam Supabase Auth: validam o token em `pacientes/services` e gravam só aquela anamnese.

## 10. Comandos

A preencher após a criação do projeto (instalação, desenvolvimento, testes, migrations, geração de tipos).

## 11. Pontos regulatórios para validar (não tratar como definitivos)

Valide com o CRO-MS, um farmacêutico e um advogado antes de vender:
- Regras de receita para antimicrobianos (campos obrigatórios, validade, vias) e para controlados.
- Guarda e validade do prontuário digital (Lei 13.787/2018).
- Enquadramento da calculadora de dose como software de apoio à decisão clínica (RDC 657/2022 da ANVISA).
- Regras do Código de Ética Odontológica e do Código de Defesa do Consumidor sobre orçamento, honorários e informação ao paciente.
- LGPD: consentimento, retenção, resposta a incidente, contratos com fornecedores.
