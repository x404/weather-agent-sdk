import {
    Agent,
    MemorySession,
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

const sampleWeather = [
    {
        names: ["берлін", "berlin"],
        city: "Берлін",
        temperatureC: 18,
        condition: "мінлива хмарність",
    },
    {
        names: ["париж", "paris"],
        city: "Париж",
        temperatureC: 22,
        condition: "сонячно",
    },
    {
        names: ["київ", "kyiv"],
        city: "Київ",
        temperatureC: 15,
        condition: "дощ",
    },
];

const weatherTool = tool({
    name: "get_weather",
    description: "Повертає навчальні дані про погоду для Берліна, Парижа та Києва.",
    parameters: z.object({
        city: z.string().trim().min(1).describe(
            "Назва міста в називному відмінку, наприклад Київ.",
        ),
    }),
    async execute({ city }) {
        console.log("[get_weather] city:", city);

        const normalizedCity = city.toLowerCase();
        const weather = sampleWeather.find((entry) =>
            entry.names.includes(normalizedCity),
        );

        if (!weather) {
            return { error: `Для міста «${city}» немає навчальних даних.` };
        }

        return {
            city: weather.city,
            temperatureC: weather.temperatureC,
            condition: weather.condition,
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


const firstQuestion = process.argv[2]?.trim() || "Яка погода в Берліні?";
const secondQuestion = process.argv[3]?.trim();

const questions = [firstQuestion];
if (secondQuestion) {
    questions.push(secondQuestion);
}

const session = new MemorySession();

for (const question of questions) {
    console.log("\nЗапитання:", question);

    const result = await run(agent, question, { session });

    for (const item of result.newItems) {
        if (item.type === "tool_call_item") {
            console.log("[SDK] Модель запросила виклик інструмента.");
        }

        if (item.type === "tool_call_output_item") {
            console.log("[SDK] Результат інструмента:", item.output);
        }
    }

    console.log("Відповідь:", result.finalOutput);
}