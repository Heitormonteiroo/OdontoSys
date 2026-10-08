# Protótipo clicável · Odonto Ipê

> PROTÓTIPO · DADOS FICTÍCIOS · NÃO USAR EM ATENDIMENTO

Este arquivo será completado ao final (como rodar, o que é simulado, o que não existe e o que falta para cada tela).

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Qualquer e-mail e senha entram; depois escolha o perfil (Dentista ou Recepção).

## Decisões e anotações (escolhas simples tomadas sem perguntar)

- Fontes (Inter) e ícones (Material Symbols Rounded) são hospedados no próprio projeto (`@fontsource/inter` e `material-symbols`), para a demo funcionar sem internet.
- Estado só em memória (Zustand). Recarregar a página (F5) reinicia a demonstração e volta ao login.
- No login, a etapa 2 (código MFA do design) foi trocada pela escolha de perfil de demonstração.
- Tailwind 3.4 (configuração em `tailwind.config.ts`, com os tokens do design).
- Todos os dados ficam em `src/mock/` (`seed/` = dados de exemplo; `store.ts` = única porta de acesso das telas).
