import {
    Agent,
    OpenAIResponsesModel,
    run,
    setTracingDisabled,
    tool,
} from "@openai/agents";
import OpenAI from "openai";
import { z } from "zod";

const apiKey = process.env.OPENROUTER_API_KEY?.trim();
const modelId = process.env.OPENROUTER_MODEL?.trim();

if (!apiKey || !modelId) {
    throw new Error("Set OPENROUTER_API_KEY and OPENROUTER_MODEL in .env.");
}

const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
});

const model = new OpenAIResponsesModel(client, modelId);

setTracingDisabled(true);

const weatherTool = tool({
    name: "get_weather",
    description: "Повертає навчальні дані про погоду для вказаного міста.",
    parameters: z.object({
        city: z.string().trim().min(1).describe("Назва міста, наприклад Берлін."),
    }),
    async execute({ city }) {
        console.log("[get_weather] city:", city);

        const normalizedCity = city.toLowerCase();
        if (normalizedCity !== "берлін" && normalizedCity !== "berlin") {
            return { error: "Навчальні дані доступні лише для Берліна." };
        }

        return {
            city: "Берлін",
            temperatureC: 18,
            condition: "мінлива хмарність",
            sample: true,
        };
    },
});

const agent = new Agent({
    name: "Помічник з погоди",
    model,
    modelSettings: { store: false },
    instructions: [
        "Відповідай українською мовою.",
        "Для запитань про погоду викликай інструмент get_weather.",
        "Спирайся на результат інструмента.",
        "Якщо інструмент повернув помилку, поясни її користувачеві.",
        "Якщо отримано показники погоди, зазнач, що це навчальні дані.",
    ].join(" "),
    tools: [weatherTool],
});

const question = process.argv[2]?.trim() || "Яка погода в Берліні?";

const result = await run(agent, question);

console.log(result.finalOutput);