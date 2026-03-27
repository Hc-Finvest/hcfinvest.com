import 'dotenv/config';
import nodemailer from 'nodemailer';

async function testSMTP() {
    console.log('--- Testing Zoho SMTP Configuration ---');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: "smtp.zoho.in",
        port: 587,
        secure: false, // STARTTLS
        auth: {
            user: "support@heddgecapitals.com",
            pass: "Jf0DLgxCEptT"
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Attempting to verify connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Verified successfully!');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
            to: process.env.SMTP_USER, // Send to self
            subject: 'SMTP Test - HC Finvest',
            text: 'This is a test email from the HC Finvest backend to verify Zoho SMTP settings.',
            html: '<b>This is a test email from the HC Finvest backend to verify Zoho SMTP settings.</b>'
        });

        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Error:', error.message);
        if (error.code === 'EAUTH') {
            console.error('Authentication failed. Please verify the App Password.');
        }
    }
}

testSMTP();
