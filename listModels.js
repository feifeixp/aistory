const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
    try {
        console.log("Fetching available models...");
        const response = await axios.get(URL);
        const models = response.data.models;
        
        console.log("Available models that support 'generateContent':");
        models.forEach(model => {
            if (model.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${model.name}`);
            }
        });
    } catch (error) {
        console.error("Error listing models:", error.response ? error.response.data : error.message);
    }
}

listModels();
