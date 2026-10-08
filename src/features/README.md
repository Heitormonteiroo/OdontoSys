# features/

Uma pasta por área do sistema. As rotas em `src/app/` são finas: só importam uma "tela" daqui.

Cada feature segue o mesmo molde (crie só as subpastas de que precisar):

```
features/<area>/
  screens/      telas completas (uma por rota)
  components/   peças usadas só por esta área
  tabs/         abas da ficha do paciente (quando for o caso)
  lib/          regras puras (filtros, validação, cálculo) — sem React
```

| Área | Estado | Etapa do plano |
|---|---|---|
| `auth/` | pronta | Login e perfil |
| `pacientes/` | pronta (lista, cadastro, ficha) | Pacientes |
| `inicio/` | a fazer | Início do dia |
| `prontuario/` | a fazer | Linha do tempo e adendos |
| `odontograma/` | a fazer | Odontograma |
| `plano/` | a fazer | Plano de tratamento e orçamento |
| `receitas/` | a fazer | Receitas e calculadora pediátrica |
| `anamnese/` | pronta (totem no tablet, aba Anamnese da ficha) | Totem de anamnese |
| `agenda/` | a fazer | Agenda semanal |

Regras da casa:
- Telas só leem/gravam dados pelo store em `src/mock/store` (nunca importam `seed/` direto).
- Regras de negócio (filtros, validação, cálculo de dose) ficam em `lib/` e não dependem de React.
- Permissões: use `can()` de `src/lib/permissions.ts`; nunca compare o papel dentro do JSX.
