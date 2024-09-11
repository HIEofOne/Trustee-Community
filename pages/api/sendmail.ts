import sendgrid from '@sendgrid/mail';
import NextCors from 'nextjs-cors';
import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
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
  console.log(process.env.MAIL_TYPE)
  if (process.env.MAIL_TYPE === 'sendgrid') {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY as any);
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
    const aws_client = new SESClient({
      "credentials": {
        "accessKeyId": process.env.AWS_ACCESS_KEY || '',
        "secretAccessKey": process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      "region": process.env.AWS_REGION || "us-east-1"
    });
    const aws_input = {
      "Source": process.env.FROM_EMAIL || 'support@hieofone.com',
      "Destination": {
        "ToAddresses": [`${req.body.email}`]
      },
      "Message": {
        "Subject": {
          "Data": req.body.subject,
          "Charset": "UTF-8"
        },
        "Body": {
          "Html": {
            "Data": req.body.html,
            "Charset": "UTF-8",
          }
        }
      }
    }
    const aws_command = new SendEmailCommand(aws_input);
    try {
      const aws_response = await aws_client.send(aws_command);
      return res.status(200).json({success: true, message: aws_response});
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ error: e });
    }
  } else {
    return res.status(500).json({ error: 'no mail setup' });
  }
}

export default sendEmail;
