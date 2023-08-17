import sendgrid from "@sendgrid/mail";
import NextCors from "nextjs-cors";

//@ts-ignore
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
async function sendEmail(req: any, res: any) {
  await NextCors(req, res, {
    methods: ["POST"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  try {
    const result = await sendgrid.send({
      to: `${req.body.email}`, // Your email where you'll receive emails
      from: "support@hieofone.com", // your website email address here
      subject: req.body.subject,
      html: req.body.html
    });
    return res.status(200).json({success: true, message: result})
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
}

export default sendEmail;
