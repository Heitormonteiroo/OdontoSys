# modules/

Um módulo por área de negócio. As rotas em `src/app/` são finas: só importam uma página daqui.
A estrutura completa (front e back) está na especificação do projeto, seção 9.

Cada módulo segue o mesmo molde (crie só o que precisar):

```
modules/<area>/
  pages/        telas completas (uma por rota)
  components/   peças usadas só por este módulo (subpastas por assunto)
  utils/        regras puras (filtros, validação, cálculo) — sem React e sem acesso a dados
  services.ts   ÚNICA porta de dados do módulo (hoje: store em memória; depois: API do backend)
```

| Módulo | Conteúdo |
|---|---|
| `auth/` | Login (fictício no protótipo) |
| `pacientes/` | Lista, cadastro, ficha; componentes de prontuário (linha do tempo), anamnese e totem, odontograma e plano de tratamento |
| `orcamentos/` | Orçamento gerado a partir do plano (não é controle financeiro) |
| `documentos/` | Documentos emitidos, reimpressão e cópia assinada; depois receitas, atestados, termos e a calculadora de dose em `utils/` |
| `agenda/` | a fazer |

Regras da casa:
- Telas e componentes leem e gravam dados só pelo `services.ts` do módulo (ou pelos hooks globais em `src/hooks/`). Nunca importam `src/mock/` direto.
- Regras de negócio ficam em `utils/` e não dependem de React.
- Um módulo pode usar componentes, utils e services de outro (ex.: `pacientes` usa `orcamentos/components` na aba Plano).
- Permissões: use `can()` de `src/utils/permissions.ts`; nunca compare o papel dentro do JSX.
