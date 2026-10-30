# Plainform

Any official form, explained in plain words, in your own language.

Official forms are written in bureaucratic language, often in a language the person filling them in doesn't read well: visa applications, hospital intake, tenancy agreements, school enrolment, bank account opening. People guess, make mistakes, and get rejected or sign things they didn't understand.

Plainform is one page. No signup, no account, nothing to install. Photograph or upload a form, pick a language, and get:

- **A one-paragraph summary** of what the form is for and what happens after you submit it.
- **Every field, one by one:** the label as printed, what it is actually asking for in plain words, and an example of a correctly formatted answer.
- **A warning flag** on fields that commonly cause rejections, such as a name that doesn't match the passport, a wrong date format, or a missing signature.
- **Documents you may need**: a checklist of what to bring or attach, such as passport, photos or insurance card.
- **Difficult words explained**: plain definitions of the legal and medical jargon on the page, like "joint and several" or "advance directive".
- **A rejection-risk filter** that shows only the fields most likely to get the form sent back.
- **An honest "couldn't read this"** when part of the page is blurred or cut off, instead of a guess. A wrong explanation on a visa form is worse than none.

Explanations are available in English, Arabic, Urdu, Hindi, Bengali, Tagalog, French and Spanish. Arabic and Urdu render right to left, Urdu in proper Nastaliq script. Results are readable on a phone, print cleanly, and the whole page has light and dark modes that follow your system setting, with a toggle.

Three sample blank forms (a visa application, a hospital intake form and a rental agreement) are built in, so you can see it working in one tap.

## Privacy

Forms contain passport numbers, medical history and home addresses, so Plainform keeps nothing:

- No database, no accounts, no file storage. The image is held in memory for the length of one request and then dropped.
- The server does not log uploaded images or their contents, and the page has no analytics.
- Images are resized in your browser before upload, so less data leaves your phone.

## Not advice

Plainform explains what a field asks for. It does not tell anyone what to write, whether they qualify, or whether to sign. It is not legal, medical or immigration advice.

## Run it locally

Requirements: Node.js 20 or later and an Anthropic API key.

```bash
git clone https://github.com/sja-thedude/Plainform.git
cd Plainform
npm install
cp .env.example .env.local   # then put your key in .env.local
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Name | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Key for the Claude API, used to read the form image. |

## Deploy

The app is a standard Next.js project and deploys to Vercel as is:

1. Import the GitHub repo into Vercel.
2. Add `ANTHROPIC_API_KEY` under Project Settings → Environment Variables.
3. Deploy.

## Stack

- Next.js 15 (App Router) and TypeScript
- Tailwind CSS 4, no component library
- Claude API (`claude-opus-5-5`) with vision and structured JSON output to read the form
- `pdf-lib` to take the first page of an uploaded PDF
- Noto fonts for Arabic (Naskh), Urdu (Nastaliq), Devanagari and Bengali
- Hosted on Vercel

## How it works

1. The browser resizes the photo and re-encodes it as JPEG. HEIC photos from iPhones are converted on browsers that can decode them. PDFs are sent as they are, and the server keeps only the first page.
2. `POST /api/explain` sends the page to Claude with instructions to list every field in reading order, explain it in the chosen language, flag known rejection risks, mark anything it cannot read as unreadable, and never give advice.
3. The response is a fixed JSON schema, validated on the server, and rendered as a summary card plus one card per field. The explanation container takes `dir="rtl"` for Arabic and Urdu, while each printed label keeps its own direction.
4. The three sample forms have pre-computed results in `public/samples/results/`, so the demo loads instantly.

## Project layout

```
src/app/page.tsx              the single page: language picker, upload, camera, samples
src/app/api/explain/route.ts  upload endpoint, in memory only
src/lib/explain.ts            prompt and Claude call
src/lib/languages.ts          supported languages and translated interface text
src/components/Result.tsx     summary and field cards, RTL aware
scripts/                      sample form templates and the result cache builder
```

## License

[MIT](LICENSE)
