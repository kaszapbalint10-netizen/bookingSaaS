// auth.js - CSAK A REGISZTRACIA RESZ JAVITVA

const express = require('express');

const { 

    createDatabase,

    connectToDatabase,

    initializeCentralDatabase,

    addStaffToCentralDirectory,

    findUserInCentralDirectory 

} = require('../../database/database');

const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const { 

  hashPassword, 

  verifyPassword, 

  generateToken, 

  verifyToken,

  generateVerificationToken,

  cleanSalonName

} = require('../services/authUtils');



const router = express.Router();



const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');



initializeCentralDatabase().catch(console.error);

async function ensureResetColumns(managementDb) {
  try {
    await managementDb
      .promise()
      .execute(
        `ALTER TABLE staff 
           ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL,
           ADD COLUMN IF NOT EXISTS reset_expires DATETIME NULL,
           ADD COLUMN IF NOT EXISTS reset_used TINYINT(1) DEFAULT 0`
      );
  } catch (error) {
    // Ha nem támogatott az IF NOT EXISTS, próbáljuk külön-külön, de ne dőljön el az app
    const alters = [
      `ALTER TABLE staff ADD COLUMN reset_token VARCHAR(255) NULL`,
      `ALTER TABLE staff ADD COLUMN reset_expires DATETIME NULL`,
      `ALTER TABLE staff ADD COLUMN reset_used TINYINT(1) DEFAULT 0`,
    ];
    for (const sql of alters) {
      try {
        await managementDb.promise().execute(sql);
      } catch (err) {
        // ha már létezik, csendben lépjünk tovább
      }
    }
  }
}

// 1) Forgot password - 5 perces token
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email megadása kötelező' });
  }

  let managementDb;
  try {
    // Keresés a központi könyvtárban, hogy megtaláljuk a management DB-t
    const centralUser = await findUserInCentralDirectory(email);
    if (!centralUser) {
      return res.status(404).json({ error: 'Felhasználó nem található' });
    }

    managementDb = await connectToDatabase(centralUser.management_db_name);
    await ensureResetColumns(managementDb);

    const token = crypto.randomBytes(32).toString('hex');

    const [updateResult] = await managementDb.promise().execute(
      `UPDATE staff 
         SET reset_token = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE), reset_used = 0 
       WHERE email = ? AND is_active = 1`,
      [token, email]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Felhasználó nem található vagy inaktív' });
    }

    await sendPasswordResetEmail(email, token);
    return res.json({ success: true, message: 'Reset e-mail elküldve' });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(500).json({ error: 'Hiba történt a reset indításakor' });
  }
});

// 2) Reset password - token + új jelszó
router.post('/reset-password', async (req, res) => {
  const { email, token, new_password } = req.body;
  if (!email || !token || !new_password) {
    return res.status(400).json({ error: 'Email, token és új jelszó kötelező' });
  }

  let managementDb;
  try {
    const centralUser = await findUserInCentralDirectory(email);
    if (!centralUser) {
      return res.status(404).json({ error: 'Felhasználó nem található' });
    }

    managementDb = await connectToDatabase(centralUser.management_db_name);
    await ensureResetColumns(managementDb);

    const [rows] = await managementDb.promise().execute(
      `SELECT id FROM staff 
         WHERE email = ? 
           AND reset_token = ? 
           AND reset_used = 0 
           AND reset_expires > NOW()`,
      [email, token]
    );

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'Érvénytelen vagy lejárt token' });
    }

    const hashed = await hashPassword(new_password);

    await managementDb.promise().execute(
      `UPDATE staff 
         SET password = ?, reset_used = 1, reset_token = NULL, reset_expires = NULL 
       WHERE email = ?`,
      [hashed, email]
    );

    return res.json({ success: true, message: 'Jelszó frissítve' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    return res.status(500).json({ error: 'Hiba történt a jelszó frissítésekor' });
  }
});



router.post('/register', async (req, res) => {

  let managementDb, salonDb;

  

  try {

    const { 

      first_name, 

      last_name, 

      email, 

      phone, 

      salon_name, 

      password,

      confirm_password 

    } = req.body;



    // ValidAciA3k

    if (!first_name || !last_name || !email || !phone || !salon_name || !password) {

      return res.status(400).json({

        error: 'Minden mezA kitAltAse kAtelezA'

      });

    }



    if (password !== confirm_password) {

      return res.status(400).json({

        error: 'A jelszavak nem egyeznek'

      });

    }



    // Szalon nAv tisztAtAsa

    const cleanSalon = cleanSalonName(salon_name);

    const salonDbName = `salon_${cleanSalon}`;



    console.log(' Creating database for:', salonDbName);



    try {

      // 1. AdatbAzisok lAtrehozAsa

      const dbs = await createDatabase(salonDbName);

      console.log('a Databases created:', dbs);



      // 2. KapcsolA3dAs a management adatbAzishoz

      managementDb = await connectToDatabase(dbs.managementDb);

      

      // 3. Staff tAbla lAtrehozAsa

      await managementDb.promise().execute(`

        CREATE TABLE IF NOT EXISTS staff (

          id INT AUTO_INCREMENT PRIMARY KEY,

          first_name VARCHAR(100) NOT NULL,

          last_name VARCHAR(100) NOT NULL,

          email VARCHAR(255) UNIQUE NOT NULL,

          password VARCHAR(255) NOT NULL,

          role ENUM('owner', 'admin', 'stylist', 'reception') DEFAULT 'owner',

          email_verified BOOLEAN DEFAULT FALSE,

          verification_token VARCHAR(100),

          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          last_login TIMESTAMP NULL,

          is_active BOOLEAN DEFAULT TRUE

        )

      `);



      // 4. KapcsolA3dAs a salon adatbAzishoz

      salonDb = await connectToDatabase(dbs.salonDb);

      

      // 5. Users tAbla lAtrehozAsa

      await salonDb.promise().execute(`

        CREATE TABLE IF NOT EXISTS users (

          id INT AUTO_INCREMENT PRIMARY KEY,

          email VARCHAR(255) UNIQUE,

          phone VARCHAR(20),

          password VARCHAR(255),

          first_name VARCHAR(100),

          last_name VARCHAR(100),

          preferred_chatbot ENUM('telegram', 'whatsapp', 'email', 'sms') DEFAULT 'telegram',

          telegram_chat_id VARCHAR(100),

          whatsapp_number VARCHAR(20),

          meta_data JSON,

          communication_preferences JSON,

          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

          last_visit TIMESTAMP NULL,

          is_active BOOLEAN DEFAULT TRUE

        )

      `);



      // 6. JelszA3 hash-elAs As verification token

      const hashedPassword = await hashPassword(password);

      const verificationToken = generateVerificationToken();



      console.log(' Generated token:', verificationToken);

      console.log(' Inserting owner:', email);



      // 7. Owner beszAorAsa a staff tAblAba

      const [insertResult] = await managementDb.promise().execute(

        `INSERT INTO staff (first_name, last_name, email, password, verification_token) 

         VALUES (?, ?, ?, ?, ?)`,

        [first_name, last_name, email, hashedPassword, verificationToken]

      );



      console.log('a Owner inserted, ID:', insertResult.insertId);



      // 8. ?? AJ: Staff hozzAadAsa a kAzponti nyilvAntartAshoz

      await addStaffToCentralDirectory({
        id: null,
        email: email,
        first_name: first_name,
        last_name: last_name,
        salon_db_name: dbs.salonDb,
        management_db_name: dbs.managementDb,
        role: 'owner'
      });

      // 8/b. Szalon felvétele a salon_browser adatbázisba
      try {
        const browserDb = await connectToDatabase('salon_browser');
        const slug = cleanSalon;
        await browserDb.promise().execute(
          `INSERT INTO salons 
             (name, slug, city, address, email, category, price_range, is_open, staff_count, primary_color, secondary_color) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             name = VALUES(name),
             city = VALUES(city),
             address = VALUES(address),
             email = VALUES(email),
             staff_count = VALUES(staff_count)`,
          [
            salon_name,
            slug,
            'Budapest',
            salon_name,
            email,
            'standard',
            '$$',
            true,
            1,
            '#5b8cff',
            '#a06bff',
          ]
        );
      } catch (browserErr) {
        console.error('Salon browser insert failed (non-critical):', browserErr.message);
      }


      // 9. EllenArzAs, hogy tAnyleg elmentAdAtt-e

      const [checkUserResult] = await managementDb.promise().execute(

        `SELECT id, email, verification_token FROM staff WHERE id = ?`,

        [insertResult.insertId]

      );



      const checkUser = checkUserResult[0];

      console.log('a User verified in DB:', checkUser);



      // 10. Verification email kA14ldAse

      await sendVerificationEmail(email, verificationToken, salon_name, `${first_name} ${last_name}`);



      res.status(201).json({

        success: true,

        message: 'Sikeres regisztrAciA3! KArjA14k erAsAtse meg email cAmAt a kA14ldAtt linkkel.',

        salon_name: salon_name,

        debug: {

          token: verificationToken,

          user_id: insertResult.insertId

        }

      });



    } catch (dbError) {

      console.error('Database error:', dbError.message);

      

      if (dbError.code === 'ER_DUP_ENTRY') {

        return res.status(400).json({

          error: 'Ez a szalon nAv vagy email mAr foglalt'

        });

      }

      

      throw dbError;

    }



  } catch (error) {

    console.error('RegisztrAciA3s hiba:', error.message);

    res.status(500).json({

      error: 'Szerver hiba a regisztrAciA3 sorAn',

      message: error.message

    });

  }

});



// Email verification - TELJESEN JAVATOTT

router.post('/verify-email', async (req, res) => {

  try {

    const { token } = req.body;



    console.log(' Verification token received:', token);



    if (!token) {

      return res.status(400).json({

        success: false,

        error: 'Verification token szA14ksAges'

      });

    }



    // KeresAs az Asszes management adatbAzisban

    const mainDb = await connectToDatabase('mysql');

    const [databasesResult] = await mainDb.promise().execute(`SHOW DATABASES LIKE 'salon_%_management'`);

    const databases = databasesResult.map(db => Object.values(db)[0]);



    console.log(' ElArhetA adatbAzisok:', databases);



    let foundUser = null;

    let foundDbName = null;



    for (const dbName of databases) {

      if (!dbName || dbName === 'undefined') continue;

      

      try {

        const managementDb = await connectToDatabase(dbName);

        

        const [usersResult] = await managementDb.promise().execute(
          `SELECT * FROM staff WHERE verification_token = ?`,
          [token]
        );

        

        const users = usersResult;



        if (users.length > 0) {

          foundUser = users[0];

          foundDbName = dbName;

          break;

        }

      } catch (error) {

        console.log(`a i  Error checking ${dbName}:`, error.message);

        continue;

      }

    }



    if (!foundUser) {

      console.log('a Token not found in any database (maybe already verified)');

      return res.json({
        success: true,
        status: 'already_verified',
        message: 'A fiók valószínűleg már megerősítve, vagy a token lejárt.'
      });

    }



    // Ha a user MAG NINCS megerAsAtve

    if (!foundUser.email_verified) {

      console.log('a User found for verification:', foundUser.email);

      

      const managementDb = await connectToDatabase(foundDbName);

      await managementDb.promise().execute(

        `UPDATE staff SET email_verified = TRUE, verification_token = NULL WHERE id = ?`,

        [foundUser.id]

      );



      console.log('a Email verification successful for:', foundUser.email);

      try {
        await addStaffToCentralDirectory({
          id: null,
          email: foundUser.email,
          first_name: foundUser.first_name,
          last_name: foundUser.last_name,
          salon_db_name: foundDbName.replace('_management', ''),
          management_db_name: foundDbName,
          role: foundUser.role || 'owner',
        });
      } catch (centralErr) {
        console.error('Central directory sync failed (non-critical):', centralErr.message);
      }

      return res.json({

        success: true,

        message: 'Email cAm sikeresen megerAsAtve! Most mAr bejelentkezhet.',

        user: {

          first_name: foundUser.first_name,

          last_name: foundUser.last_name,

          email: foundUser.email

        },

        status: 'verified'

      });

    } 

    // Ha a user MAR megerAsAtve van

    else {

      console.log('a1i  User already verified:', foundUser.email);

      

      return res.json({

        success: true,

        message: 'Email cAm mAr korAbban megerAsAtAsre kerA14lt.',

        user: {

          first_name: foundUser.first_name,

          last_name: foundUser.last_name,

          email: foundUser.email

        },

        status: 'already_verified'

      });

    }



  } catch (error) {

    console.error('Email verification error:', error.message);

    res.status(500).json({

      success: false,

      error: 'Szerver hiba az email verification sorAn'

    });

  }

});





// DEBUG: EllenArizzA14k a staff tAblAt - JAVATOTT

router.get('/debug-staff', async (req, res) => {

  try {

    const mainDb = await connectToDatabase('mysql');

    const [databasesResult] = await mainDb.promise().execute(`SHOW DATABASES LIKE 'salon_%_management'`);

    const databases = databasesResult.map(db => Object.values(db)[0]); //  JAVATOTT

    

    const results = [];

    

    for (const dbName of databases) {

      if (!dbName || dbName === 'undefined') continue;

      

      try {

        const managementDb = await connectToDatabase(dbName);

        const [staffResult] = await managementDb.promise().execute(`SELECT id, email, verification_token, email_verified FROM staff`);

        

        results.push({

          database: dbName,

          staff: staffResult

        });

        

        console.log(` ${dbName} staff:`, staffResult);

      } catch (error) {

        console.log(`a i  Error with ${dbName}:`, error.message);

      }

    }

    

    res.json(results);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

});



// MANUALIS ACTIVATION - JAVATOTT

router.post('/manual-activate', async (req, res) => {

  try {

    const { email } = req.body;

    

    console.log(' Manual activation for:', email);



    const mainDb = await connectToDatabase('mysql');

    const [databasesResult] = await mainDb.promise().execute(`SHOW DATABASES LIKE 'salon_%_management'`);

    const databases = databasesResult.map(db => Object.values(db)[0]); //  JAVATOTT



    for (const dbName of databases) {

      if (!dbName || dbName === 'undefined') continue;

      

      try {

        const managementDb = await connectToDatabase(dbName);

        const [usersResult] = await managementDb.promise().execute(

          `SELECT * FROM staff WHERE email = ?`,

          [email]

        );

        

        const users = usersResult;



        if (users.length > 0) {

          const user = users[0];

          await managementDb.promise().execute(

            `UPDATE staff SET email_verified = TRUE, verification_token = NULL WHERE id = ?`,

            [user.id]

          );

          

          console.log(`a User activated in ${dbName}`);

          return res.json({ 

            success: true, 

            message: `User activated in ${dbName}`,

            user: {

              email: user.email,

              first_name: user.first_name,

              last_name: user.last_name

            }

          });

        }

      } catch (error) {

        console.log(`a i  Error with ${dbName}:`, error.message);

      }

    }

    

    res.status(404).json({ error: 'User not found' });

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

});



module.exports = router;





// auth.js - JAVATOTT BEJELENTKEZASI LOGIKA

router.post('/login', async (req, res) => {

  try {

    const { email, password } = req.body;

    

    console.log(' BejelentkezAsi kAsArlet:', email);



    if (!email || !password) {

      return res.status(400).json({ error: 'Email As jelszA3 megadAsa kAtelezA' });

    }



    //   USER KERESASE A CENTRALIS ADATBAZISBAN

    let userInCentral = await findUserInCentralDirectory(email);
    let fallbackFound = null;
    let fallbackDb = null;

    

    if (!userInCentral) {

      console.log('a User nem talAlhatA3 kAzponti adatbAzisban, fallback keresA:', email);

      // fallback: keressük meg valamelyik management DB-ben a usert, és szinkronizáljuk a centralba
      const mainDb = await connectToDatabase('mysql');
      const [dbsResult] = await mainDb.promise().execute(`SHOW DATABASES LIKE 'salon_%_management'`);
      const dbs = dbsResult.map((db) => Object.values(db)[0]);
      let found = null;
      let foundDb = null;
      for (const dbName of dbs) {
        try {
          const mgmt = await connectToDatabase(dbName);
          const [rows] = await mgmt
            .promise()
            .execute('SELECT * FROM staff WHERE email = ? AND is_active = TRUE', [email]);
          if (rows.length) {
            found = rows[0];
            foundDb = dbName;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (found && foundDb) {
        fallbackFound = found;
        fallbackDb = foundDb;
        try {
          await addStaffToCentralDirectory({
            id: null,
            email: found.email,
            first_name: found.first_name,
            last_name: found.last_name,
            salon_db_name: foundDb.replace('_management', ''),
            management_db_name: foundDb,
            role: found.role || 'owner',
          });
          userInCentral = await findUserInCentralDirectory(email);
        } catch (syncErr) {
          console.error('Central sync fallback failed:', syncErr.message);
        }
      }

      if (!userInCentral && fallbackFound && fallbackDb) {
        userInCentral = {
          id: fallbackFound.id,
          email: fallbackFound.email,
          first_name: fallbackFound.first_name,
          last_name: fallbackFound.last_name,
          salon_db_name: fallbackDb.replace('_management', ''),
          management_db_name: fallbackDb,
          role: fallbackFound.role || 'owner',
        };
      }

      if (!userInCentral) {
        return res.status(401).json({ error: 'HibAs email vagy jelszA3' });
      }

    }



    console.log('a User talAlhatA3:', email, 'szalon:', userInCentral.salon_db_name);



    //   JELSZA ELLENARZASE MANAGEMENT DB-BEN

    const managementDb = await connectToDatabase(userInCentral.management_db_name);

    

    const [users] = await managementDb.promise().execute(

      'SELECT * FROM staff WHERE email = ? AND is_active = TRUE',

      [email]

    );



    if (users.length === 0) {

      console.log('a User nem talAlhatA3 management DB-ben:', email);

      return res.status(401).json({ error: 'HibAs email vagy jelszA3' });

    }



    const user = users[0];

    

    //   JELSZA ELLENARZASE

    const isPasswordValid = await bcrypt.compare(password, user.password);

    

    if (!isPasswordValid) {

      console.log('a HibAs jelszA3:', email);

      return res.status(401).json({ error: 'HibAs email vagy jelszA3' });

    }



    console.log('a JelszA3 helyes:', email);



    //   EMAIL MEGERASATAS ELLENARZASE - STYLIST-OKNAL NEM KATELEZA

    // Owner-Aknek kAtelezA, de stylist/reception nem kell

    const requiresEmailVerification = user.role === 'owner';

    

    if (requiresEmailVerification && !user.email_verified) {

      console.log('a Email nincs megerAsAtve:', email);

      return res.status(401).json({ 

        error: 'KArjA14k erAsAtsd meg email cAmedet a bejelentkezAs elAtt',

        requiresVerification: true 

      });

    }



    console.log('a Email stAtusz OK:', email, 'verified:', user.email_verified);



    //   TOKEN GENERALASA

    const token = jwt.sign(

      {

        userId: user.id,

        email: user.email,

        salonDb: userInCentral.salon_db_name,

        role: user.role,

        firstName: user.first_name,

        lastName: user.last_name

      },

      process.env.JWT_SECRET || 'fallback_secret',

      { expiresIn: '7d' }

    );



    //   LAST_LOGIN FRISSATASE

    await managementDb.promise().execute(

      'UPDATE staff SET last_login = NOW() WHERE id = ?',

      [user.id]

    );



    //   CENTRAL DIRECTORY LAST_LOGIN FRISSATASE

    try {

      const centralDb = await connectToDatabase('central_salon_management');

      await centralDb.promise().execute(

        'UPDATE staff_directory SET last_login = NOW() WHERE email = ?',

        [email]

      );

    } catch (centralError) {

      console.log('a i  Central last_login update failed (non-critical):', centralError.message);

    }



    console.log('a BejelentkezAs sikeres:', email, 'role:', user.role);



    res.json({

      success: true,

      token: token,

      user: {

        id: user.id,

        email: user.email,

        first_name: user.first_name,

        last_name: user.last_name,

        role: user.role,

        salon_db: userInCentral.salon_db_name,

        email_verified: user.email_verified

      },

      message: 'Sikeres bejelentkezAs!'

    });



  } catch (error) {

    console.error('a BejelentkezAsi hiba:', error.message);

    res.status(500).json({ error: 'Szerver hiba a bejelentkezAs sorAn' });

  }

});



// Token validAlAs As user adatok - JAVATOTT

router.get('/me', async (req, res) => {

  try {

    const token = req.headers.authorization?.replace('Bearer ', '');

    

    if (!token) {

      return res.status(401).json({

        error: 'Token szA14ksAges'

      });

    }



    const decoded = verifyToken(token);

    

    // User adatok lekArAse - JAVATOTT

    const managementDbName = `${decoded.salonDb}_management`;

    const managementDb = await connectToDatabase(managementDbName);

    

    //  JAVATOTT: execute helyes hasznAlata

    const [usersResult] = await managementDb.promise().execute(

      `SELECT id, first_name, last_name, email, role, last_login FROM staff WHERE id = ?`,

      [decoded.userId]

    );

    

    const users = usersResult;



    if (users.length === 0) {

      return res.status(401).json({

        error: 'FelhasznAlA3 nem talAlhatA3'

      });

    }



    const userData = {

      ...users[0],

      salon_db: decoded.salonDb

    };



    res.json({

      success: true,

      user: userData

    });



  } catch (error) {

    console.error('Token validAlAsi hiba:', error.message);

    res.status(401).json({

      error: 'ArvAnytelen token'

    });

  }

});







// MANUALIS TOKEN BEALLATAS

router.post('/set-token', async (req, res) => {

  try {

    const { email, token } = req.body;

    

    const mainDb = await connectToDatabase('mysql');

    const [databases] = await mainDb.execute(`SHOW DATABASES LIKE 'salon_%_management'`);



    for (const db of databases) {

      const dbName = db.Database;

      if (!dbName || dbName === 'undefined') continue;

      

      try {

        const managementDb = await connectToDatabase(dbName);

        const [result] = await managementDb.execute(

          `UPDATE staff SET verification_token = ?, email_verified = FALSE WHERE email = ?`,

          [token, email]

        );

        

        if (result.affectedRows > 0) {

          console.log(`a Token set for ${email} in ${dbName}`);

          return res.json({ 

            success: true, 

            message: `Token set in ${dbName}` 

          });

        }

      } catch (error) {

        console.log(`a i  Error with ${dbName}:`, error.message);

      }

    }

    

    res.status(404).json({ error: 'User not found' });

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

});





module.exports = router;

