import config from '../config/app.config.js';
const portalUrl = config.portalUrl;

function baseTemplate({ title, bodyHtml }) {
  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${title || 'Notification'}</title>
    <style>
      body { background-color: #f6f9fc; margin: 0; padding: 0; }
      .container { max-width: 560px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(16,24,40,0.06); }
      .header { background: #0ea5e9; color: #ffffff; padding: 16px 24px; font-family: Arial, sans-serif; }
      .content { padding: 24px; font-family: Arial, sans-serif; color: #111827; line-height: 1.6; }
      .footer { padding: 16px 24px; font-family: Arial, sans-serif; color: #6b7280; font-size: 12px; }
      a.button { display: inline-block; background: #0ea5e9; color: #fff !important; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: bold; }
      .muted { color: #6b7280; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2 style="margin:0;">${title || 'Notification'}</h2>
      </div>
      <div class="content">
        ${bodyHtml}
      </div>
      <div class="footer">
        <div class="muted">This is an automated message from the clinic system.</div>
      </div>
    </div>
  </body>
</html>`;
}

export function renderNotificationEmail({ title, message, linkUrl = portalUrl }) {
  const safeMessage = (message || '').replace(/\n/g, '<br/>');
  const bodyHtml = `
    <p>${safeMessage}</p>
    <p style="margin-top:16px;">
      <a class="button" href="${linkUrl}" target="_blank" rel="noopener">Open Patient Portal</a>
    </p>
    <p class="muted" style="margin-top:16px;">မြန်မာစာ: အထောက်အထားအချက်အလက်များကို သင့်လူနာပို့တောလ်တွင် ကြည့်ရှုနိုင်ပါသည်။</p>
  `;
  return {
    subject: title || 'Notification',
    html: baseTemplate({ title: title || 'Notification', bodyHtml }),
  };
}

export function renderWelcomeEmail({ firstName, linkUrl = portalUrl }) {
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
  const myGreeting = firstName ? `မင်္ဂလာပါ ${firstName}၊` : 'မင်္ဂလာပါ၊';
  const bodyHtml = `
    <p>${greeting}</p>
    <p>Welcome to our clinic’s Patient Portal. Your account has been created successfully.</p>
    <ul>
      <li>View appointments and reminders</li>
      <li>Receive notifications from the clinic</li>
      <li>Manage your profile</li>
    </ul>
    <p style="margin-top:16px;">
      <a class="button" href="${linkUrl}" target="_blank" rel="noopener">Open Patient Portal</a>
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p>${myGreeting}</p>
    <p>ကျွန်ုပ်တို့၏ လူနာပို့တောလ်သို့ ကြိုဆိုပါသည်။ သင့်အကောင့်ကို အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ။</p>
    <ul>
      <li>ရက်ချိန်ခြင်းများနှင့် အကြောင်းကြားချက်များကို ကြည့်ရှုနိုင်သည်</li>
      <li>ဆေးခန်းမှ အသိပေးချက်များကို လက်ခံနိုင်သည်</li>
      <li>သင့်ကိုယ်ပိုင်အချက်အလက်များ စီမံခန့်ခွဲနိုင်သည်</li>
    </ul>
    <p style="margin-top:16px;" class="muted">မှတ်ချက်။ မိမိမှ မဟုတ်ပါက ဆေးခန်းကို ဆက်သွယ်ပါ။</p>
  `;
  return {
    subject: 'Welcome to the Patient Portal',
    html: baseTemplate({ title: 'Welcome to the Patient Portal', bodyHtml }),
  };
}


