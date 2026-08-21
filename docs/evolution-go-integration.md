# Evolution GO na mesma VPS

O WhatsWay pode enviar mensagens por uma instância Evolution GO sem usar a Meta Cloud API.

## Variáveis do WhatsWay

```env
EVOLUTION_GO_URL=http://127.0.0.1:8080
EVOLUTION_GO_API_KEY=chave-global-ou-token-da-instancia
```

Para um canal `connectionMethod=evolution`, o campo `accessToken` armazena o token da instância Evolution GO e `phoneNumberId` armazena o nome da instância. O envio de texto usa `POST /send/text`.

## Subir o Evolution GO

No clone `evolution-go-custom`, configure `deploy/.env` com `GLOBAL_API_KEY` e execute:

```bash
cd evolution-go-custom/deploy
docker compose up -d --build
```

A porta 8080 deve ficar acessível apenas localmente ou pela rede privada entre os serviços. Não exponha o PostgreSQL do Evolution GO.
