export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

const OWNER_EMAIL="vishwamistry18@gmail.com"

const transporter=nodemailer.createTransport({

service:"gmail",

auth:{

user:process.env.GMAIL_USER,

pass:process.env.GMAIL_PASS

}

})

// ─── TEMPLATE (UNCHANGED) ─────────────────────────

function buildOwnerEmail(d: {

firstName:string
lastName:string
userEmail:string
subject:string
message:string

}):string{

const now=new Date().toLocaleString("en-IN",{

timeZone:"Asia/Kolkata",

dateStyle:"full",

timeStyle:"short"

})

const fullName=`${d.firstName} ${d.lastName}`.trim()

const ticketId=`EP-${Date.now().toString(36).toUpperCase().slice(-6)}`

const year=new Date().getFullYear()

return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>

<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

<!-- YOUR TEMPLATE UNCHANGED -->

<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 16px;">
<tr><td align="center">

<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

<tr>

<td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);
border-radius:16px 16px 0 0;
padding:28px 36px;
text-align:center;">

<span style="font-size:22px;
font-weight:900;
color:#fff;">

Edu<span style="color:#fbbf24;">Pilot</span>

</span>

<p style="color:rgba(255,255,255,0.8);
font-size:13px;">

New Contact Form Submission

</p>

</td>

</tr>

<tr>

<td style="background:#1e2130;
padding:32px 36px;">

<h2 style="color:#f1f5f9;">

New Message from Contact Form

</h2>

<p style="color:#64748b;">

Ticket:

<strong>${ticketId}</strong>

· ${now}

</p>

<p style="color:white">

Name:

${fullName}

</p>

<p style="color:white">

Email:

${d.userEmail}

</p>

<p style="color:white">

Subject:

${d.subject}

</p>

<p style="color:white">

Message:

</p>

<p style="color:#e2e8f0">

${d.message}

</p>

</td>

</tr>

<tr>

<td style="background:#13161f;
padding:20px;
text-align:center;">

<p style="color:#475569;">

© ${year} EduPilot

</p>

</td>

</tr>

</table>

</td></tr>

</table>

</body>

</html>`
}

// ─── USER CONFIRMATION EMAIL ───────────────

function buildUserEmail(name:string){

return `

<div style="font-family:Arial;
max-width:600px;
margin:auto;
padding:30px;
background:#0f172a;
color:white;
border-radius:12px">

<h2 style="color:#fbbf24">

EduPilot Support

</h2>

<p>

Hello ${name},

</p>

<p>

We have received your query.

</p>

<p>

Our team will respond within 24 hours.

</p>

<br>

<p>

Regards

<br>

EduPilot Team

</p>

</div>

`
}

// ─── API ────────────────────────────────

export async function POST(req:NextRequest){

try{

const {firstName,lastName,email,subject,message}=await req.json()

if(!firstName||!email||!subject||!message){

return NextResponse.json({

error:"All fields required"

},{status:400})

}

// EMAIL TO OWNER

await transporter.sendMail({

from:`EduPilot <${process.env.GMAIL_USER}>`,

to:OWNER_EMAIL,

replyTo:email,

subject:`[EduPilot Contact] ${subject}`,

html:buildOwnerEmail({

firstName:firstName.trim(),

lastName:(lastName||"").trim(),

userEmail:email.trim(),

subject,

message

})

})

// EMAIL TO USER

await transporter.sendMail({

from:`EduPilot <${process.env.GMAIL_USER}>`,

to:email,

subject:"We received your query",

html:buildUserEmail(firstName)

})

return NextResponse.json({

success:true

})

}catch(err){

console.error(err)

return NextResponse.json({

error:"Email failed"

},{status:500})

}

}