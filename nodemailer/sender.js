const transporter = require('./nodemailer');
require('dotenv').config();

async function sendConfirmationEmail(email,token) {
    try {
        const confirmationLink = `http://localhost:${process.env.APP_PORT}/user/confirm?token=${token}`;

        await transporter.sendMail({
            from: `${process.env.EMAIL}`, // Sender email address
            to: email, // Recipient email address
            subject: 'Confirmation Email',
            text: 'Please confirm your email address by clicking the link below:',
            html: `<p>Please confirm your email address by clicking the link below:</p><a href="${confirmationLink}">Click here to confirm your account!</a>`
        });

    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
}

module.exports = sendConfirmationEmail;
