import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const { name, email, business, platform, description, notes } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: `"SheetPilot" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Thanks for contacting SheetPilot!',
      text: `
Hi ${name},

Thanks for reaching out to SheetPilot! We're excited to help automate your spreadsheets.

Details you submitted:
- Business: ${business}
- Platform: ${platform}
- Description: ${description}
- Notes: ${notes}

We’ll be in touch shortly.

— SheetPilot Team
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      status: 'success',
      message: 'Confirmation email sent!'
    });

  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to send email'
    });
  }
}
