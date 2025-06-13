import formidable from 'formidable';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Disable Next.js body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS); // Store your credentials JSON in env

const auth = new google.auth.GoogleAuth({
  credentials: CREDENTIALS,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

const SHEET_ID = '100nM9Rg1v-0W4PeLwq88iqhbu-CSV7vqbnzrElL_mXk'; // Replace with your SheetPilot Clients Sheet ID
const PARENT_FOLDER_ID = '1Rvpj53IoFty6f36qegZIXdQeyoMyxAXP'; // Replace with your SheetPilot Uploads Folder ID

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });
  form.uploadDir = '/tmp';

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: 'Form parsing error' });
    }

    const name = fields.name?.trim();
    const business = fields.business?.trim();
    const email = fields.email?.trim();
    const platform = fields.platform?.trim();
    const description = fields.description?.trim();
    const notes = fields.notes?.trim();
    const file = files.sampleFile;

    const clientFolderName = `${name.split(' ').slice(-1)[0]} - ${business}`;

    try {
      // Create folder in Drive
      const folderMetadata = {
        name: clientFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [PARENT_FOLDER_ID],
      };
      const folder = await drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });

      const folderId = folder.data.id;
      const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

      // Upload file if present
      if (file && file.filepath) {
        const fileMetadata = {
          name: file.originalFilename,
          parents: [folderId],
        };
        const media = {
          mimeType: file.mimetype,
          body: fs.createReadStream(file.filepath),
        };
        await drive.files.create({
          resource: fileMetadata,
          media,
          fields: 'id',
        });
      }

      // Append data to Google Sheet
      const row = [
        new Date().toLocaleString(),
        name,
        business,
        `${clientFolderName}`,
        folderId,
        platform,
        description,
        notes,
        folderUrl,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [row],
        },
      });

      return res.status(200).json({
        status: 'success',
        folderUrl,
      });
    } catch (e) {
      console.error('Submission Error:', e);
      return res.status(500).json({
        status: 'error',
        message: e.message || 'An unexpected error occurred.',
      });
    }
  });
}
