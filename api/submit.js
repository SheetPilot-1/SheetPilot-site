import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
const {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_SENDER_EMAIL
} = process.env;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { name, email, business, platform, description, notes } = req.body;

    // 1. Create Google Drive folder for this client
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    const driveAuth = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: driveAuth });

    const folderMetadata = {
      name: `${name} — ${business}`,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    const folderId = folder.data.id;
    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

    // 2. Send confirmation email via Gmail API
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      refresh_token: GMAIL_REFRESH_TOKEN
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const messageParts = [
      `To: ${email}`,
      `Subject: Thanks for contacting SheetPilot!`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      `Hi ${name},`,
      ``,
      `Thanks for reaching out! We're excited to help you automate your spreadsheets.`,
      ``,
      `Here's your project folder for reference:`,
      folderUrl,
      ``,
      `We’ll be in touch shortly.`,
      ``,
      `— SheetPilot Team`
    ];

    const rawMessage = Buffer.from(messageParts.join('\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage
      }
    });

    // Respond success
    return res.status(200).json({
      status: 'success',
      folderUrl
    });

  } catch (error) {
    console.error('Submission error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
