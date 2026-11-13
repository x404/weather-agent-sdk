A TypeScript weather assistant built with the OpenAI Agents SDK and OpenRouter. It uses sample weather data for Berlin, Paris, and Kyiv.

## Setup

Run `npm install`. Copy `.env.example` to `.env` and set `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`.

## Run

```bash
npm run typecheck
npm start -- 'Яка погода в Києві?' 'Яка там температура?'
```

The dispatcher calls a weather specialist through `Agent.asTool()`. Type `так` to approve a call or `ні` to reject it. Questions passed in the same command share an in-memory session. The CLI prints tool results and model usage after each question.