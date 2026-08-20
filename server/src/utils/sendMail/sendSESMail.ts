import { Buffer } from "buffer";
import { sesClient } from "../../config/sesClient";
import nodemailer from "nodemailer";
import { Readable } from "nodemailer/lib/xoauth2";
  

interface MyAttachment {
  filename: string;
  contentType: string;
  content: any;
}


// Nodemailer transport using AWS SES
const transporter = nodemailer.createTransport(({
  SES: { ses: sesClient, aws: { SendRawEmailCommand: require("@aws-sdk/client-ses").SendRawEmailCommand } },
} as any));

export const sendSesEmailWithAttachment = async (
  toAddress: string,
  subject: string,
  htmlBody: string,
  textBody?: string,
  attachments: MyAttachment[] = [],
  cc?: string | string[]
) => {
  try {
    const info = await transporter.sendMail({
      from: '"Pickmymaid Support Team" <support@pickmymaid.com>',
      to: toAddress,
      cc,
      subject,
      text: textBody,
      html: htmlBody,
      attachments: attachments.map((att) => ({
          filename: att.filename,
        content: Buffer.from(att.content.replace(/^data:application\/pdf;base64,/, ""), "base64"),
          contentType: att.contentType,
      })),
    });

    return info;
  } catch (error) {
    if (error instanceof Error && error.name === "MessageRejected") {
      return error;
    }
    throw error;
  }
};