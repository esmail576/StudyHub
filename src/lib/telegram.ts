export async function downloadTelegramFile(fileId: string) {
  try {
    // Debug log
    console.log('Starting file download with ID:', fileId);
    console.log('Bot token:', import.meta.env.TELEGRAM_BOT_TOKEN ? 'Present' : 'Missing');

    // First, get the file path from Telegram
    const fileInfoResponse = await fetch(
      `https://api.telegram.org/bot${import.meta.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    
    if (!fileInfoResponse.ok) {
      const errorData = await fileInfoResponse.json();
      console.error('Telegram API Error:', errorData);
      throw new Error('Failed to get file info from Telegram: ' + (errorData.description || 'Unknown error'));
    }

    const fileInfo = await fileInfoResponse.json();
    console.log('File info response:', fileInfo);
    
    if (!fileInfo.ok || !fileInfo.result.file_path) {
      throw new Error('Invalid file info from Telegram');
    }

    // Then, download the file using the file path
    const fileUrl = `https://api.telegram.org/file/bot${import.meta.env.TELEGRAM_BOT_TOKEN}/${fileInfo.result.file_path}`;
    console.log('Downloading from URL:', fileUrl);
    
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      const errorData = await fileResponse.json();
      console.error('File download error:', errorData);
      throw new Error('Failed to download file from Telegram: ' + (errorData.description || 'Unknown error'));
    }

    // Get the file as a blob
    const blob = await fileResponse.blob();
    console.log('File downloaded, size:', blob.size);
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `note-${fileId}.pdf`; // You might want to use a more descriptive name
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
} 
  try {
    // Debug log
    console.log('Starting file download with ID:', fileId);
    console.log('Bot token:', import.meta.env.TELEGRAM_BOT_TOKEN ? 'Present' : 'Missing');

    // First, get the file path from Telegram
    const fileInfoResponse = await fetch(
      `https://api.telegram.org/bot${import.meta.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    
    if (!fileInfoResponse.ok) {
      const errorData = await fileInfoResponse.json();
      console.error('Telegram API Error:', errorData);
      throw new Error('Failed to get file info from Telegram: ' + (errorData.description || 'Unknown error'));
    }

    const fileInfo = await fileInfoResponse.json();
    console.log('File info response:', fileInfo);
    
    if (!fileInfo.ok || !fileInfo.result.file_path) {
      throw new Error('Invalid file info from Telegram');
    }

    // Then, download the file using the file path
    const fileUrl = `https://api.telegram.org/file/bot${import.meta.env.TELEGRAM_BOT_TOKEN}/${fileInfo.result.file_path}`;
    console.log('Downloading from URL:', fileUrl);
    
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      const errorData = await fileResponse.json();
      console.error('File download error:', errorData);
      throw new Error('Failed to download file from Telegram: ' + (errorData.description || 'Unknown error'));
    }

    // Get the file as a blob
    const blob = await fileResponse.blob();
    console.log('File downloaded, size:', blob.size);
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `note-${fileId}.pdf`; // You might want to use a more descriptive name
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
} 