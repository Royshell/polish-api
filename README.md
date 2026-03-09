# polish-api

Vercel serverless proxy for the [Polish Chrome Extension](https://github.com/royshell/polish).  
Receives a style prompt from the extension, calls the Groq API, and returns generated CSS.

The API key lives here on the server — never in the extension bundle.

---

## Endpoint

```
POST /api/generate
Content-Type: application/json

{ "prompt": "dark mode with warm amber tones" }
```

```json
{ "css": "body { background: #1a1a1a !important; ... }" }
```

---

## Run locally

**1. Get a Groq API key**

- Go to [console.groq.com](https://console.groq.com)
- Sign up / log in → API Keys → Create API Key
- Free tier is enough

**2. Clone and install**

```bash
git clone https://github.com/royshell/polish-api
cd polish-api
npm install
```

**3. Add your key**

Create `.env.local` in the project root:

```
GROQ_API_KEY=gsk_your_key_here
```

**4. Start the server**

```bash
npm run local
# → http://localhost:3001/api/generate
```

**5. Test it**

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "dark mode with purple accents"}' \
  | python3 -m json.tool
```

---

## Deploy

Push to `main` — Vercel deploys automatically.

Add `GROQ_API_KEY` in Vercel Dashboard → Settings → Environment Variables.
