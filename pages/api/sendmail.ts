import sendgrid from '@sendgrid/mail';
import NextCors from 'nextjs-cors';
import nodemailer from 'nodemailer';
import * as AWS from "aws-sdk";
type EmailPayload = {
  to: string
  subject: string
  html: string
};

async function sendEmail(req: any, res: any) {
  await NextCors(req, res, {
    methods: ["POST"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  if (process.env.MAIL_TYPE === 'sendgrid') {
    //@ts-ignore
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    try {
      const result = await sendgrid.send({
        to: `${req.body.email}`,
        from: process.env.FROM_EMAIL || 'support@hieofone.com',
        subject: req.body.subject,
        html: req.body.html
      });
      return res.status(200).json({success: true, message: result});
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  } else if (process.env.MAIL_TYPE === 'smtp') {
    const smtpOptions = {
      host: process.env.SMTP_HOST || "smtp.mailtrap.io",
      port: parseInt(process.env.SMTP_PORT || "2525"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || "user",
        pass: process.env.SMTP_PASSWORD || "password",
      }
    };
    const sendEmail = async (data: EmailPayload) => {
      const transporter = nodemailer.createTransport({
        ...smtpOptions,
      });
      return await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'support@hieofone.com',
        ...data,
      });
    };
    try {
      const result = await sendEmail({
        to: `${req.body.email}`,
        subject: req.body.subject,
        html: req.body.html
      });
      return res.status(200).json({success: true, message: result});
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  } else if (process.env.MAIL_TYPE === 'aws') {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: "ap-south-1",
    });
    AWS.config.getCredentials(function (error) {
      if (error) {
        console.log(error.stack);
      }
    });
    const ses = new AWS.SES({ apiVersion: "2010-12-01" });
    const ses_sendEmail = async (data: EmailPayload) => {
      const ses_transporter = nodemailer.createTransport({
        SES: ses,
      });
      return await ses_transporter.sendMail({
        from: process.env.FROM_EMAIL || 'support@hieofone.com',
        ...data,
      });
    };
    try {
      const ses_result = await ses_sendEmail({
        to: `${req.body.email}`,
        subject: req.body.subject,
        html: req.body.html
      });
      return res.status(200).json({success: true, message: ses_result});
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  } else {
    return res.status(500).json({ error: 'no mail setup' });
  }
}

export default sendEmail;
