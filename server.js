const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;
const TEXT_MODEL_NAME = "gemini-2.5-flash";
const TTS_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;
const TEXT_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL_NAME}:generateContent?key=${API_KEY}`;


app.post('/generate', async (req, res) => {
    try {
        const { story, action, playerState } = req.body;

        const prompt = `
            You are a text adventure game master.
            The current story is: "${story}"
            The player is at location: "${playerState.currentLocation}"
            The player has these items: "${playerState.inventory.join(', ')}"
            The player's action is: "${action}"

            Generate the next part of the story.
            Your response must be a JSON object with the following structure:
            {
              "storyText": "The new paragraph of the story.",
              "newLocation": "The player's new location (or the same if it doesn't change).",
              "itemsGained": [],
              "itemsLost": [],
              "suggestedActions": ["action 1", "action 2", "action 3"]
            }

            Be creative and descriptive. If the player tries something impossible, describe the failure humorously.
            Provide three relevant and interesting suggested actions.
            Do not include any text other than the JSON object in your response.
        `;

        const textRequestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        const textAIResponse = await axios.post(TEXT_URL, textRequestBody);
        
        const text = textAIResponse.data.candidates[0].content.parts[0].text;
        
        const jsonResponse = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

        const ttsRequestBody = {
            "input": {
                "text": jsonResponse.storyText
            },
            "voice": {
                "languageCode": "zh-CN",
                "name": "zh-CN-Wavenet-A"
            },
            "audioConfig": {
                "audioEncoding": "MP3"
            }
        };

        const ttsResponse = await axios.post(TTS_URL, ttsRequestBody);
        
        if (ttsResponse.data.audioContent) {
            jsonResponse.audioContent = ttsResponse.data.audioContent;
        } else {
            jsonResponse.audioContent = null;
        }

        res.json(jsonResponse);
    } catch (error) {
        console.error("Error during story generation:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to generate story from AI.", details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Game server listening at http://localhost:${port}`);
});

