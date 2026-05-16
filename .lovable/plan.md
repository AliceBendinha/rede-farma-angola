# Gestão de Stock por Farmácia

## Objetivo
Permitir que cada farmácia controle o stock dos seus medicamentos, com indicadores visuais por cor, alertas SMS automáticos para o telefone da farmácia, e visibilidade da disponibilidade para os utilizadores finais.

## 1. Modelo de dados (migração)

Adicionar à tabela `medicamentos`:
- `quantidade_stock` (integer, default 0, NOT NULL) — unidades em stock
- `stock_minimo` (integer, default 5, NOT NULL) — limiar de "atenção"
- `ultimo_alerta_em` (timestamptz, nullable) — para evitar SMS repetidos (cooldown 24h)

Validação no cadastro/edição da farmácia: telefone obrigatório em formato internacional E.164 (ex.: `+244923456789`). Aplicar via Zod no frontend.

## 2. Regras de cor (estado do stock)

| Estado | Condição | Cor (token) |
|---|---|---|
| Disponível | `quantidade_stock > stock_minimo` | verde (success) |
| Atenção | `0 < quantidade_stock <= stock_minimo` | amarelo (warning) |
| Esgotado | `quantidade_stock = 0` | vermelho (destructive) |

Adicionar tokens `--success` e `--warning` em `index.css` e `tailwind.config.ts`.

## 3. Painel da farmácia (`MedicamentosTab`)

- Nova coluna **Stock** na tabela, com badge colorido (estado + número).
- Inputs `Quantidade em stock` e `Stock mínimo` no formulário.
- Acção rápida "Ajustar stock" (+/-) sem abrir o diálogo completo.
- Ao guardar: se o stock baixar para ≤ mínimo ou 0, invocar edge function `send-stock-alert`.

## 4. Edge function `send-stock-alert` (Twilio)

- Recebe `medicamento_id`.
- Lê medicamento + farmácia (telefone).
- Valida E.164.
- Verifica cooldown (`ultimo_alerta_em` > 24h ou null).
- Envia SMS via Twilio através do gateway de conectores Lovable.
- Atualiza `ultimo_alerta_em`.
- Mensagem PT-AO: "Rede Farma: stock baixo de {nome} ({qtd} unidades). Reponha em breve."

## 5. Visibilidade pública

- `MedicamentoCard` (homepage/comparação): badge de disponibilidade ("Disponível" / "Pouco stock" / "Esgotado").
- `FarmaciaDetalhes`: mostrar mesmo badge na lista de medicamentos.
- Filtro opcional "apenas em stock" na pesquisa (fase 2 — não incluído agora).

## 6. Integração Twilio

Conectar via `standard_connectors--connect` (connector_id: `twilio`). O utilizador escolhe/cria a conexão. Após ligada, a edge function usa `LOVABLE_API_KEY` + `TWILIO_API_KEY` do ambiente.

## Detalhes técnicos

**Ficheiros a alterar:**
- `supabase/migrations/<novo>.sql` — colunas de stock
- `src/index.css`, `tailwind.config.ts` — tokens success/warning
- `src/components/farmacia/MedicamentosTab.tsx` — campos, coluna, ajuste rápido, trigger alerta
- `src/components/MedicamentoCard.tsx` — badge disponibilidade
- `src/pages/FarmaciaDetalhes.tsx` — badge nos medicamentos
- `src/components/admin/...` (formulário de farmácia) — validação E.164 do telefone
- `supabase/functions/send-stock-alert/index.ts` (novo) + entrada em `supabase/config.toml`
- `src/lib/stock.ts` (novo) — helper `getStockStatus()` partilhado

**Stack:** React + Supabase + Twilio (via connector gateway). RLS já permite à farmácia gerir os próprios medicamentos.

## Confirmação necessária
Vou pedir-lhe para ligar o conector **Twilio** antes de criar a edge function de SMS. Confirma este plano para eu avançar?
