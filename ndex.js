const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { google } = require("googleapis");

const app = express();
app.use(bodyParser.json());

// ENV VARIABLES
const VERIFY_TOKEN = "aiarthub123";
const ACCESS_TOKEN = "EAAVFZAdxHALkBRS9X3ZCijYQM8vq2oNRYk0q9opm6mbCoLiSDkZAVq3ZCgC0MLToXTkPkCCZAxeEvowLfAU1UykKx33Upxu3i7ZCNjBDhrSmZBVR9WMD3DUSaYqaTp967XWJSDi2kp1SFJxio3h2KLZAnaqrPF9IQ9feyaDfZCBufXFqz0u2YwkoYm9ZCOXe30MOjpUCDrlGNGN6ZB2ZBd42FwJn1ji3gfwCSzP72XeZCvjfAeE8ZCkGjHe7MJxUTQk5XkX5ZBkAYipZBotB8EdBB4oc75Ya2x5kfAZDZD";

// Google Sheets Setup
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const spreadsheetId = "1eq7QWd-SqoSEvQOs3Ohty5fLBHjgVqHS6yprl5SW2RI/edit?gid=0#gid=0";

// Webhook Verify
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook Receive Message
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry[0];
    const changes = entry.changes[0];
    const message = changes.value.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body || "";

      console.log("Message:", text);

      // Save to Google Sheet
      await saveToSheet(from, text);

      // Reply
      await sendMessage(from, "Thanks ji 🙂 humne aapki details note kar li hai, jaldi connect karte hain!");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Save to Google Sheet
async function saveToSheet(phone, message) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1!A:G",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        ["", phone, "", "", "", message, new Date().toLocaleString()],
      ],
    },
  });
}

// Send WhatsApp Message
async function sendMessage(to, text) {
  await axios.post(
    `https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages`,
    {
      messaging_product: "whatsapp",
      to: to,
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

app.listen(3000, () => console.log("Server running"));
