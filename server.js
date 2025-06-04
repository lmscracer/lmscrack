const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const token = '8092182836:AAF_8vR2Crkrm_ToWrURsDZtCju_T4HYzxQ';
const chatId = '7929230676';
let lastUpdateId = 0;

app.get('/latest', async (req, res) => {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}`);
    const updates = response.data;

    if (updates.ok && updates.result.length > 0) {
      let lastText = null;
      let newUpdateId = lastUpdateId;

      updates.result.forEach(msg => {
        if (msg.message && msg.message.text) {
          newUpdateId = msg.update_id;
          lastText = msg.message.text;
        }
      });

      if (newUpdateId > lastUpdateId) {
        lastUpdateId = newUpdateId;
      }

      return res.json({
        success: true,
        message: lastText,
        update_id: newUpdateId
      });
    }

    res.json({ success: false, message: null, update_id: lastUpdateId });
  } catch (error) {
    console.error('❌ Telegramdan xabar olishda xatolik:', error.message);
    res.status(500).json({ success: false });
  }
});

app.post('/upload-html', async (req, res) => {
  const html = req.body.html;
  if (!html) return res.status(400).json({ success: false, error: 'Bo‘sh HTML' });

  const filePath = path.join(__dirname, 'page.html');
  fs.writeFileSync(filePath, html, 'utf-8');

  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("document", fs.createReadStream(filePath), 'page.html');

  try {
    const tgRes = await axios.post(`https://api.telegram.org/bot${token}/sendDocument`, form, {
      headers: form.getHeaders()
    });
    return res.json({ success: true, result: tgRes.data });
  } catch (err) {
    console.error("❌ Telegramga yuborishda xatolik:", err.message);
    return res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
});
