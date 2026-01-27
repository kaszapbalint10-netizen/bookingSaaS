const router = require('express').Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { connectToDatabase } = require('../../database/database');
const { sendGuestVerificationEmail } = require('../services/emailService');

router.post('/register-guest', async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  
  try {
    console.log('🎯 Vendég regisztráció:', email);
    console.log('📧 Request body:', JSON.stringify(req.body, null, 2));

    // Validáció
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ error: 'Minden kötelező mezőt ki kell tölteni' });
    }

    // Email validáció
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Érvénytelen email formátum' });
    }

    // AZONNALI EMAIL ELLENŐRZÉS - duplikáció megelőzése
    const db = await connectToDatabase('users');
    const [existingUsers] = await db.promise().execute(
      'SELECT id FROM registered_users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log('🛑 Email már regisztrálva:', email);
      return res.status(400).json({ error: 'Ez az email cím már regisztrálva van' });
    }

    // Jelszó hash-elés
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Email verification token generálás
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log('🔑 Generated token:', verificationToken);

    // User létrehozása
    const [result] = await db.promise().execute(
      `INSERT INTO registered_users (
        first_name, last_name, email, phone, password,
        email_verified, verification_token, verification_expires
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName,
        lastName,
        email,
        phone,
        hashedPassword,
        false,
        verificationToken,
        verificationExpires
      ]
    );

    console.log('✅ Vendég sikeresen regisztrálva, ID:', result.insertId);

    // EMAIL KÜLDÉS - JAVÍTOTT
    try {
      console.log('📨 Email küldés előkészítése...');
      
      // Helyes paraméterekkel hívjuk meg
      const emailResult = await sendGuestVerificationEmail(
        email, // első paraméter: email cím
        verificationToken, // második paraméter: token
        firstName, // harmadik paraméter: keresztnév
        lastName // negyedik paraméter: vezetéknév
      );
      
      console.log('✅ Megerősítő email elküldve:', email);
    } catch (emailError) {
      console.error('❌ Email küldési hiba:', emailError.message);
      console.error('❌ Email hiba részletek:', emailError);
    }

    res.json({
      success: true,
      message: 'Sikeres regisztráció! Kérjük erősítse meg email címét a küldött link segítségével.',
      userId: result.insertId,
      emailSent: true
    });

  } catch (error) {
    console.error('❌ Vendég regisztrációs hiba:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ez az email cím már regisztrálva van' });
    }
    
    res.status(500).json({ error: 'Hiba a regisztráció során: ' + error.message });
  }
});


// Email megerősítés endpoint
router.get('/verify-guest-email', async (req, res) => {
  try {
    const { token } = req.query;
    console.log('🔐 GUEST Verification token received:', token);

    if (!token) {
      return res.status(400).json({ error: 'Hiányzó token' });
    }

    // FONTOS: CSAK a users adatbázishoz kapcsolódunk
    const db = await connectToDatabase('users');
    console.log('✅ Kapcsolódva a users adatbázishoz GUEST verifikációhoz');

    // Token ellenőrzése CSAK a registered_users táblában
    const [users] = await db.promise().execute(
      `SELECT id, first_name, email, email_verified FROM registered_users 
       WHERE verification_token = ? 
       AND verification_expires > NOW()`,
      [token]
    );

    console.log('🔍 GUEST Found users for token:', users.length);
    
    if (users.length > 0) {
      console.log('🔍 GUEST User details:', {
        id: users[0].id,
        email: users[0].email,
        verified: users[0].email_verified
      });
    }

    if (users.length === 0) {
      return res.status(400).json({ 
        error: 'Érvénytelen vagy lejárt token. Kérjük regisztráljon újra.' 
      });
    }

    const user = users[0];

    console.log(`🔍 GUEST Verifying user: ${user.email}`);

    if (user.email_verified) {
      console.log(`ℹ️ GUEST User already verified: ${user.email}`);
      return res.json({
        success: true,
        message: `Köszönjük ${user.first_name}! Email címe már korábban meg volt erősítve.`
      });
    }

    // Email megerősítése
    await db.promise().execute(
      `UPDATE registered_users 
       SET email_verified = TRUE, 
           verification_token = NULL,
           verification_expires = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [user.id]
    );

    console.log(`✅ GUEST Email megerősítve: ${user.email}`);

    res.json({
      success: true,
      message: `Köszönjük ${user.first_name}! Email címe sikeresen megerősítve.`,
      user: {
        id: user.id,
        firstName: user.first_name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ GUEST Email megerősítési hiba:', error.message);
    res.status(500).json({ error: 'Hiba az email megerősítése során' });
  }
});


// Új verification email küldése
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email cím megadása kötelező' });
    }

    const db = await connectToDatabase('users');

    // User keresése
    const [users] = await db.promise().execute(
      'SELECT id, first_name, last_name, email_verified FROM registered_users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Felhasználó nem található' });
    }

    const user = users[0];

    if (user.email_verified) {
      return res.status(400).json({ error: 'Ez az email cím már meg van erősítve' });
    }

    // Új token generálása
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Token frissítése
    await db.promise().execute(
      `UPDATE registered_users 
       SET verification_token = ?, verification_expires = ? 
       WHERE id = ?`,
      [verificationToken, verificationExpires, user.id]
    );

    // Email küldése
    await sendVerificationEmail({
      email: email,
      verificationToken: verificationToken,
      firstName: user.first_name,
      lastName: user.last_name
    });

    console.log('✅ Új megerősítő email elküldve:', email);

    res.json({
      success: true,
      message: 'Új megerősítő email elküldve! Kérjük ellenőrizze postaládáját.'
    });

  } catch (error) {
    console.error('❌ Új megerősítő email küldési hiba:', error.message);
    res.status(500).json({ error: 'Hiba az email küldése során' });
  }
});

// guest.js - ADD HOOZZÁ EZT A DEBUG ROUTE-OT
router.get('/debug-guest-verify', async (req, res) => {
  try {
    const { token, email } = req.query;
    
    console.log('=== DEBUG GUEST VERIFY ===');
    console.log('Token:', token);
    console.log('Email:', email);
    
    const db = await connectToDatabase('users');
    
    // Keresés token alapján
    if (token) {
      const [tokenUsers] = await db.promise().execute(
        'SELECT * FROM registered_users WHERE verification_token = ?',
        [token]
      );
      console.log('GUEST Users with this token:', tokenUsers.length);
      tokenUsers.forEach(user => {
        console.log(`- ${user.email} (verified: ${user.email_verified})`);
      });
    }
    
    // Keresés email alapján
    if (email) {
      const [emailUsers] = await db.promise().execute(
        'SELECT * FROM registered_users WHERE email = ?',
        [email]
      );
      console.log('GUEST Users with email:', emailUsers.length);
      emailUsers.forEach(user => {
        console.log(`- ID: ${user.id}, verified: ${user.email_verified}, token: ${user.verification_token}`);
      });
    }

    // Összes user listázása (opcionális)
    const [allUsers] = await db.promise().execute(
      'SELECT id, email, email_verified, verification_token FROM registered_users LIMIT 10'
    );
    console.log('ALL GUEST Users (first 10):', allUsers);

    res.json({
      message: 'Debug completed - check server logs',
      tokenUsers: token ? await getUsersByToken(db, token) : [],
      emailUsers: email ? await getUsersByEmail(db, email) : [],
      allUsers: allUsers
    });
    
  } catch (error) {
    console.error('Guest debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Segédfüggvények
async function getUsersByToken(db, token) {
  const [users] = await db.promise().execute(
    'SELECT id, email, email_verified, verification_token FROM registered_users WHERE verification_token = ?',
    [token]
  );
  return users;
}

async function getUsersByEmail(db, email) {
  const [users] = await db.promise().execute(
    'SELECT id, email, email_verified, verification_token FROM registered_users WHERE email = ?',
    [email]
  );
  return users;
}

// Másik debug route a users adatbázis ellenőrzésére
router.get('/debug-users-db', async (req, res) => {
  try {
    const db = await connectToDatabase('users');
    
    // Ellenőrizzük, hogy létezik-e a registered_users tábla
    const [tables] = await db.promise().execute(
      'SHOW TABLES LIKE "registered_users"'
    );
    
    const tableExists = tables.length > 0;
    console.log('Registered_users table exists:', tableExists);
    
    if (tableExists) {
      // Összes user a registered_users táblából
      const [allUsers] = await db.promise().execute(
        'SELECT id, email, email_verified, verification_token, created_at FROM registered_users ORDER BY created_at DESC'
      );
      
      console.log('All registered_users:', allUsers);
      
      res.json({
        tableExists: true,
        users: allUsers,
        totalUsers: allUsers.length
      });
    } else {
      res.json({
        tableExists: false,
        message: 'registered_users table does not exist'
      });
    }
    
  } catch (error) {
    console.error('Debug users DB error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;