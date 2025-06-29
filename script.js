const storyLog = document.getElementById('story-log');
const userInput = document.getElementById('user-input');
const submitButton = document.getElementById('submit-button');
const actionButtons = document.getElementById('action-buttons');
const audioPlayer = document.getElementById('audio-player');

let player = {
    currentLocation: "tavern",
    inventory: []
};

let story = "你身處一間光線昏暗的小酒館。一個神秘的身影坐在角落裡。";
let isLoading = false;

function appendToStory(text, isAction = false) {
    const p = document.createElement('p');
    if (isAction) {
        p.innerHTML = `&gt; <i>${text}</i>`;
    } else {
        p.textContent = text;
    }
    storyLog.appendChild(p);
    storyLog.scrollTop = storyLog.scrollHeight;
}

function setLoading(loading) {
    isLoading = loading;
    userInput.disabled = loading;
    submitButton.disabled = loading;
    document.querySelectorAll('.action-button').forEach(button => {
        button.disabled = loading;
    });
}

function playAudio(audioContent) {
    if (!audioContent) {
        console.warn("No audio content received from server.");
        return;
    }
    try {
        const audioBlob = new Blob([new Uint8Array(atob(audioContent).split("").map(char => char.charCodeAt(0)))], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioPlayer.src = audioUrl;
        audioPlayer.play();
    } catch (e) {
        console.error("Failed to decode or play audio:", e);
        appendToStory("錯誤：無法播放音訊。");
    }
}

function handleUserInput() {
    const action = userInput.value.trim();
    if (action && !isLoading) {
        userInput.value = '';
        generateStory(action);
    }
}

async function generateStory(action) {
    setLoading(true);
    appendToStory(action, true);

    try {
        const response = await fetch('http://localhost:3000/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                story: story,
                action: action,
                playerState: player
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || `Request failed with status ${response.status}`);
        }

        const data = await response.json();

        story = data.storyText;
        player.currentLocation = data.newLocation;
        
        if (data.itemsGained && data.itemsGained.length > 0) {
            player.inventory.push(...data.itemsGained);
        }
        if (data.itemsLost && data.itemsLost.length > 0) {
            player.inventory = player.inventory.filter(item => !data.itemsLost.includes(item));
        }

        appendToStory(story);
        playAudio(data.audioContent);
        updateActionButtons(data.suggestedActions);

    } catch (error) {
        console.error("Error in generateStory:", error);
        appendToStory(`發生錯誤： ${error.message}`);
    } finally {
        setLoading(false);
    }
}

function createActionButton(text, action) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'action-button';
    button.addEventListener('click', () => {
        if (!isLoading) {
            generateStory(action);
        }
    });
    actionButtons.appendChild(button);
}

function updateActionButtons(suggestions) {
    actionButtons.innerHTML = '';
    if (suggestions) {
        suggestions.forEach(suggestion => {
            createActionButton(suggestion, suggestion);
        });
    }
}


submitButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserInput();
    }
});

// Initial story setup
appendToStory(story);
generateStory("look around"); // Generate initial suggestions
