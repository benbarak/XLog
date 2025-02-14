const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON without body-parser
app.use(express.json());

// Webhook verification
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// Handling incoming messages
app.post('/webhook', async (req, res) => {
    const messageEvent = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (messageEvent) {
        const senderId = messageEvent.from;
        const messageText = messageEvent.text?.body;

        console.log(`Received message from ${senderId}: ${messageText}`);

        await sendMessage(senderId, `You said: ${messageText}`);
    }

    res.sendStatus(200);
});

// Sending messages using fetch instead of axios
async function sendMessage(to, text) {
    const url = `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`;
    const token = process.env.WHATSAPP_API_TOKEN;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: to,
                type: "text",
                text: { body: text }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        console.log(`Message sent to ${to}: ${text}`);
    } catch (error) {
        console.error("Error sending message:", error.message);
    }
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
