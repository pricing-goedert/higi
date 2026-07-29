# GoHub Higiexpo

App da feira Higiexpo 2026 (29ª Feira de Produtos e Serviços para Higiene,
Limpeza e Conservação Ambiental) — Goedert Group. Deixa o vendedor consultar,
durante a feira, se uma empresa já é cliente (e de qual representante) e
cadastrar leads novos, mesmo com internet ruim ou sem internet.

## Estrutura do repositório

```
/CLAUDE.md          instruções para agentes de IA (fica na raiz por convenção)
/docs/               README.md (este arquivo), ARCHITECTURE.md, SPECS.md
/docs/design-frame/  referência visual estática (HTML/CSS puro, sem lógica)
```

Este repositório está em transição entre um protótipo já funcional e a versão
final planejada. Duas coisas convivem aqui agora:

1. **`docs/design-frame/`** — recriação estática (HTML/CSS puro, sem lógica, sem
   backend) do visual do protótipo antigo. Serve como referência visual exata
   para a reconstrução, e pode ser aberta e navegada por qualquer pessoa sem
   precisar rodar nada.
2. **A reconstrução real** — ainda não começou. Vai seguir a arquitetura
   descrita em `ARCHITECTURE.md` (nesta pasta).

Para entender o que o app precisa fazer, ver `SPECS.md` (nesta pasta). Para
entender como vai ser construído (e por quê), ver `ARCHITECTURE.md` (nesta
pasta). Para instruções voltadas a agentes de IA trabalhando neste
repositório, ver `/CLAUDE.md` na raiz.

## Como ver as coisas agora

- **Design frame**: abra `design-frame/index.html` com dois cliques —
  navega entre todas as telas, sem precisar de internet nem de nada
  instalado.

## Funcionalidades de referência

- Telas: Home (busca global, destaques, menu), Pesquisa/Lista/Detalhe de
  Representante, Pesquisa/Lista/Detalhe de Cliente, Cadastro de Leads,
  Programação, Mapa da Feira, Indicações → Restaurantes, Orientações,
  Produtos (categorias → linhas → tipos → produto). Ver `SPECS.md` para a
  versão atualizada dessa lista.
- Dados de teste no Firebase Firestore, projeto `mkt-to-go`. Leads sem
  conexão ficam em `localStorage` do aparelho, mas **nunca são reenviados
  automaticamente** ao servidor — isso é um dos problemas que a versão nova
  corrige (ver `ARCHITECTURE.md`, seção de outbox de leads).
- Identidade visual: azul `#143C52`, fonte Inter, cards raio 20px, inputs
  56px — reaproduzida em `design-frame/styles.css`.

## Contato

Equipe de Marketing — Goedert Group.
