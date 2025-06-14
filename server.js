const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { Bot } = require('grammy');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS
app.use(cors());

// Create Telegram bot instance
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// Download endpoint
app.get('/api/download-note/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log('Downloading file:', fileId);

    // Get file info from Telegram
    const fileInfo = await bot.api.getFile(fileId);
    console.log('File info:', fileInfo);

    if (!fileInfo || !fileInfo.file_path) {
      throw new Error('File not found in Telegram');
    }

    // Get the file from Telegram
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;
    console.log('File URL:', fileUrl);

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to download file from Telegram');
    }

    // Get the file buffer
    const buffer = await response.buffer();

    // Set appropriate headers
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileInfo.file_path.split('/').pop() || 'file')}`);
    res.setHeader('Content-Length', buffer.length);

    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: error.message || 'Failed to download file' });
  }
});

// Upload endpoint
app.post('/api/upload-to-telegram', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    const formData = new FormData();
    formData.append('document', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });

    // Add metadata to caption
    const caption = [
      `Title: ${req.body.title || 'Untitled'}`,
      `Description: ${req.body.description || 'No description'}`,
      `Subject: ${req.body.subject || 'Other'}`,
      `Course Code: ${req.body.course_code || 'N/A'}`,
      `Major: ${req.body.major || 'N/A'}`,
      `Uploaded by: ${req.body.uploader_name || 'Anonymous'}`
    ].join('\n');

    // Send file to Telegram
    const message = await bot.api.sendDocument(process.env.TELEGRAM_CHANNEL_ID, formData, {
      caption: caption
    });

    if (!message.document?.file_id) {
      throw new Error('Failed to get file ID from Telegram');
    }

    res.json({
      success: true,
      telegram_message_id: message.message_id,
      file_id: message.document.file_id
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 