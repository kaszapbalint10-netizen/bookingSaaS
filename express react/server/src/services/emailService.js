const nodemailer = require('nodemailer');

// Gmail transporter létrehozása - JAVÍTOTT SZINTAXIS
const createTransporter = async () => {
  return await nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};



// emailService.js - ellenőrizd a token generálást
async function sendVerificationEmail(email, verificationToken, salonName, ownerName) {
  try {
    const transporter = await createTransporter();
    
    console.log('📧 Email küldés - Token:', verificationToken);
    console.log('📧 Email küldés - Cím:', email);
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    console.log('📧 Verification URL:', verificationUrl); 

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Erősítsd meg ${salonName} regisztrációját`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5ac8fa;">Üdvözöljük a Salon Management rendszerben!</h2>
          
          <p>Kedves <strong>${ownerName}</strong>,</p>
          
          <p>Köszönjük, hogy regisztrálta <strong>${salonName}</strong> szalonját!</p>
          
          <p>Kérjük erősítse meg email címét a következő gombra kattintva:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #5ac8fa; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;">
              Email cím megerősítése
            </a>
          </div>
          
          <p>Ha a gomb nem működik, másolja be ezt a linket a böngészőjébe:</p>
          <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 5px;">
            ${verificationUrl}
          </p>
          
          <p><em>Ez a link 24 óráig érvényes.</em></p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email elküldve: ${email}`);
    return result;
  } catch (error) {
    console.error('❌ Email küldési hiba:', error.message);
    throw error;
  }
}

// Password reset e-mail (5 perces token)
async function sendPasswordResetEmail(email, resetToken) {
  try {
    const transporter = await createTransporter();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Password reset request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5ac8fa;">Password reset</h2>
          <p>Someone (hopefully you) requested a password reset.</p>
          <p>Click the button below to set a new password. This link is valid for 5 minutes and can be used only once.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #5ac8fa; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;">
              Reset password
            </a>
          </div>
          <p>If the button does not work, copy this link into your browser:</p>
          <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 5px;">
            ${resetUrl}
          </p>
          <p><em>If you didn't request this, you can ignore this email.</em></p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent: ${email}`);
    return result;
  } catch (error) {
    console.error('Password reset email error:', error.message);
    throw error;
  }
}

// 🎯 ÚJ FUNKCIÓ: Csapat meghívó email küldése
// 🎯 JAVÍTOTT: Csapat meghívó email küldése TOKENNEL
async function sendTeamInvitationEmail(email, salonName, inviterName, invitationToken) {
  try {
    const transporter = await createTransporter();
    
    console.log('📧 Team invitation email küldése TOKENNEL:', email);
    console.log('📧 Token első 16 karaktere:', invitationToken?.substring(0, 16) + '...');
    
    // 🎯 REGISZTRÁCIÓS URL TOKENNEL
    const registrationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register-stylist?token=${invitationToken}`;

    const subject = `Meghívó a ${salonName} csapatába`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1>🎉 Meghívó a ${salonName} csapatába!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>Kedves Kolléga!</h2>
          <p><strong>${inviterName}</strong> meghívott, hogy csatlakozz a <strong>${salonName}</strong> csapatához a Salon Management rendszerben!</p>
          
          <p>💼 <strong>A te feladatod:</strong> Fodrász/szolgáltató leszel a szalonban</p>
          <p>⏰ <strong>Hozzáférésed lesz:</strong> Saját időpontjaihoz, ügyfelekhez, bevétel nyilvántartáshoz</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registrationUrl}" 
               style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Regisztráció és csatlakozás
            </a>
          </div>
          
          <p><strong>Fontos:</strong> A fenti gombra kattintva tudod létrehozni a profilodat és csatlakozni a csapathoz.</p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404;">
              <strong>📝 Megjegyzés:</strong> A regisztráció során használd ezt az email címet: <strong>${email}</strong>
            </p>
            <p style="margin: 10px 0 0 0; color: #856404;">
              <strong>⏰ Figyelem:</strong> Ez a meghívó 7 napig érvényes!
            </p>
          </div>
          
          <p>Ha a gomb nem működik, másold be ezt a linket a böngésződbe:</p>
          <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px;">
            ${registrationUrl}
          </p>
          
          <p>Köszönjük, hogy csatlakozol hozzánk! 🎊</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
          <p>Üdvözlettel,<br><strong>${salonName} csapata</strong></p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: subject,
      html: html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Team invitation email elküldve TOKENNEL: ${email}`);
    return result;
  } catch (error) {
    console.error('❌ Team invitation email küldési hiba:', error.message);
    throw error;
  }
}

const sendGuestVerificationEmail = async (email, verificationToken, firstName, lastName) => {
  try {
    console.log('🚀 GUEST Email küldés indítása...');
    console.log('📧 GUEST Cím:', email);
    console.log('📧 GUEST Token:', verificationToken);
    console.log('📧 GUEST Név:', firstName, lastName);

    if (!email) {
      throw new Error('Nincs email cím megadva');
    }

    if (!verificationToken) {
      throw new Error('Nincs verification token megadva');
    }

    const transporter = await createTransporter();
    
    // FONTOS: verify-guest-email endpoint használata
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-guest-email?token=${verificationToken}`;
    
    console.log('📧 GUEST Verification URL:', verificationUrl);

    const mailOptions = {
      from: {
        name: 'Salon Management',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: `Erősítsd meg email címed - Salon Management`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>Üdvözöljük! 🎉</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2>Kedves ${firstName}!</h2>
            
            <p>Köszönjük, hogy regisztrált vendégként a Salon Management rendszerünkben!</p>
            
            <p>Az alábbi gombra kattintva erősítheti meg email címét:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Email cím megerősítése
              </a>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404;">
                <strong>⏰ Fontos:</strong> Ez a megerősítő link 24 óráig érvényes!
              </p>
            </div>
            
            <p>Ha a gomb nem működik, másolja be ezt a linket a böngészőjébe:</p>
            <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px;">
              ${verificationUrl}
            </p>
            
            <p>Miután megerősítette email címét, teljes körűen használhatja vendég fiókját:</p>
            <ul>
              <li>✅ Időpontfoglalás</li>
              <li>✅ Profil kezelés</li>
              <li>✅ Kedvezmények</li>
              <li>✅ Előnyben részesítés</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
            <p>Üdvözlettel,<br><strong>Salon Management csapata</strong></p>
          </div>
        </div>
      `
    };

    console.log('📧 GUEST Mail options előkészítve, küldés...');
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ GUEST Vendég megerősítő email elküldve: ${email}`);
    console.log('📧 GUEST Email küldés eredménye:', result.messageId);
    
    return result;
  } catch (error) {
    console.error('❌ GUEST Vendég megerősítő email küldési hiba:', error.message);
    throw error;
  }
};



module.exports = {
  sendVerificationEmail,
  sendTeamInvitationEmail,
  sendGuestVerificationEmail,
  sendPasswordResetEmail,
};
