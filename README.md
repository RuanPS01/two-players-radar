# two-players-radar

Radar **fictício** de proximidade para dois jogadores: uma pessoa **controla** a
intensidade dos "apitos" do radar e a outra **usa** o radar, ouvindo os apitos e
vendo o pulso na tela — em tempo real. Pense em uma brincadeira de "quente/frio":
o controlador aumenta o nível conforme o alvo se aproxima e quem está com o radar
escuta os apitos ficarem cada vez mais rápidos.

Aplicação web estática feita com **Vite** (JS puro), pronta para publicar no
**GitHub Pages**.

## Como funciona

1. Na tela inicial, defina o **nome do radar** (ex: `sala-de-estar`). Esse nome é
   o identificador central: quem usar o mesmo nome entra no mesmo radar, então
   várias duplas podem brincar em radares diferentes ao mesmo tempo.
2. Escolha uma das opções:
   - **🎧 Usar radar** — abre a tela do ouvinte. A intensidade é comunicada só
     pelo **som dos apitos** e por um **círculo preenchido que cresce** dentro do
     núcleo do radar (sem mostrar o número nem o nome do nível). Essa pessoa só
     escuta/observa; o nível é definido pela outra.
   - **🎚️ Controlar radar** — abre a tela do controlador, que escolhe o nível.

O ouvinte precisa **tocar uma vez** na tela ("Ativar radar") para liberar o áudio
— exigência das políticas de autoplay dos navegadores.

### Os 6 níveis

| Nível | Nome         | Comportamento                          |
| ----- | ------------ | -------------------------------------- |
| 1     | Silêncio     | Radar em repouso, sem apitos.          |
| 2     | Lento        | Apitos espaçados.                      |
| 3     | Moderado     | Apitos sequenciais moderados.          |
| 4     | Rápido       | Apitos rápidos.                        |
| 5     | Muito rápido | Apitos muito rápidos.                  |
| 6     | Contínuo     | Apito contínuo, sem pausa.             |

O som é gerado pela **Web Audio API** (osciladores), sem arquivos de áudio. No
ouvinte, o círculo vai de um ponto pequeno (silêncio) até preencher todo o núcleo
(contínuo).

## Sincronização em tempo real (por que MQTT)

O requisito era um site estático no GitHub Pages e um jeito simples de o
controlador informar o nível para o ouvinte. As opções consideradas:

- **Servidor WebSocket próprio** — precisaria de um backend hospedado à parte; o
  GitHub Pages é só arquivos estáticos. ❌ Complica o objetivo.
- **Firebase Realtime Database** — funciona em site estático, mas exige criar um
  projeto no Google, colar credenciais e configurar regras de segurança. ⚠️
  Mais robusto/privado, porém com atrito de configuração.
- **Broker MQTT público sobre WebSocket** — escolhido. ✅ Zero cadastro, zero
  credenciais, funciona direto do navegador, e o modelo *pub/sub* encaixa
  perfeitamente: **o nome do radar vira o tópico**
  (`two-players-radar/<nome>/level`), isolando cada radar. Mensagens *retained*
  fazem quem entra depois já receber o nível atual.

Broker padrão: `wss://broker.emqx.io:8084/mqtt` (público). Como o tópico é
público, qualquer pessoa que souber o nome do radar poderia entrar — o que é
aceitável para uma brincadeira. Para algo privado, veja abaixo.

### Trocar o broker (sem rebuild)

- Via URL: `.../#/radar/meu-radar` com `?broker=wss://seu-broker:porta/mqtt`
  (o parâmetro vem **antes** do `#`), ex:
  `https://seu-usuario.github.io/two-players-radar/?broker=wss://seu-broker:8084/mqtt#/radar/meu-radar`
- Via console: `localStorage.setItem('radar:broker', 'wss://seu-broker:porta/mqtt')`
- Definitivo: altere `DEFAULT_BROKER` em [`src/config.js`](src/config.js).

### Migrar para Firebase (opcional)

Se quiser mais robustez/privacidade, dá para substituir só a camada de sincronismo
([`src/radar-sync.js`](src/radar-sync.js)), mantendo o resto igual. A ideia:

1. Crie um projeto no Firebase e ative o **Realtime Database**.
2. `npm install firebase` e inicialize com a config do seu projeto.
3. Reimplemente `RadarSync` usando um nó por radar, ex:
   `ref(db, 'radars/<nome>/level')` — o controlador faz `set(ref, nivel)` e o
   ouvinte usa `onValue(ref, cb)`. A interface pública (`onLevel`, `onStatus`,
   `publishLevel`) permanece a mesma, então as telas não mudam.

## Desenvolvimento

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # gera o dist/
npm run preview  # serve o build localmente
```

## Deploy no GitHub Pages

Já existe um pipeline em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
que faz build e publica automaticamente. Para ativar:

1. No GitHub, vá em **Settings → Pages** e, em **Build and deployment → Source**,
   selecione **GitHub Actions**.
2. Faça merge/push para a branch **`main`**. O workflow roda, builda e publica.
   (Também é possível disparar manualmente em **Actions → Deploy to GitHub Pages →
   Run workflow**.)
3. A aplicação ficará em `https://<seu-usuario>.github.io/two-players-radar/`.

> O `base` do Vite em [`vite.config.js`](vite.config.js) está como
> `/two-players-radar/` (o nome do repositório). Se você renomear o repositório,
> ajuste esse valor.

## Estrutura

```
src/
  main.js          # roteador + montagem das telas
  router.js        # roteamento por hash (#/...), ideal para GitHub Pages
  config.js        # broker padrão + override em runtime
  radar-sync.js    # camada de tempo real (MQTT)
  audio.js         # motor de apitos (Web Audio API)
  levels.js        # definição dos 5 níveis
  style.css        # tema visual do radar
  pages/
    home.js        # tela inicial (nome + escolha)
    control.js     # tela do controlador
    radar.js       # tela do ouvinte (pulso + som)
    status.js      # helper de status de conexão
```
