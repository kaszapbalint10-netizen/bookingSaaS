// server/src/routes/dashboard/auth.js

const router = require('express').Router();

const bcrypt = require('bcrypt');

const { 

  verifyStylistInvitation, 

  acceptStylistInvitation, 

  addStaffToCentralDirectory,

  connectToDatabase 

} = require('../../../database/database');



// MeghAvA3 ellenArzAse token alapjAn

router.get('/verify-invitation/:token', async (req, res) => {

  try {

    const { token } = req.params;

    

    console.log(' Verifying invitation token:', token.substring(0, 16) + '...');

    

    const invitation = await verifyStylistInvitation(token);

    

    if (!invitation) {

      return res.status(400).json({ 

        success: false, 

        error: 'ArvAnytelen vagy lejArt meghAvA3' 

      });

    }

    

    res.json({ 

      success: true, 

      invitation: {

        email: invitation.email,

        salon: invitation.invited_by_salon,

        role: invitation.invited_role

      }

    });

    

  } catch (error) {

    console.error('a Invitation verification error:', error.message);

    res.status(500).json({ error: 'Hiba a meghAvA3 ellenArzAsekor' });

  }

});



// Stylist regisztrAciA3 meghAvA3val

router.post('/register-stylist', async (req, res) => {

  try {

    const { token, password, first_name, last_name, phone, specialization } = req.body;

    

    console.log('  Stylist registration with token:', token?.substring(0, 16) + '...');

    

    if (!token || !password || !first_name || !last_name) {

      return res.status(400).json({ error: 'Token, jelszA3 As nAv megadAsa kAtelezA' });

    }



    // MeghAvA3 ellenArzAse

    const invitation = await verifyStylistInvitation(token);

    

    if (!invitation) {

      return res.status(400).json({ error: 'ArvAnytelen vagy lejArt meghAvA3' });

    }



    console.log('a Invitation found for:', invitation.email);



    // JelszA3 hash-elAse

    const saltRounds = 12;

    const hashedPassword = await bcrypt.hash(password, saltRounds);



    // Staff lAtrehozAsa management DB-ben

    const managementDb = await connectToDatabase(invitation.management_db_name);

    

    const [result] = await managementDb.promise().execute(

      `INSERT INTO staff (first_name, last_name, email, password, role, is_active, email_verified) 

       VALUES (?, ?, ?, ?, ?, ?, ?)`,

      [

        first_name, 

        last_name, 

        invitation.email, 

        hashedPassword,

        invitation.invited_role, 

        1,

        1  // Email automatikusan megerAsAtve stylist-oknak

      ]

    );



    console.log('a Stylist added to management DB, ID:', result.insertId);



    // Staff hozzAadAsa a central directory-hoz (azonos ID-vel)

    try {

      await addStaffToCentralDirectory({

        id: result.insertId,

        email: invitation.email,

        first_name: first_name,

        last_name: last_name,

        salon_db_name: invitation.salon_db_name,

        management_db_name: invitation.management_db_name,

        role: invitation.invited_role

      });

      console.log('a Staff added to central directory');

    } catch (centralError) {

      console.error('a Central directory error (deleting management entry):', centralError.message);

      await managementDb.promise().execute('DELETE FROM staff WHERE id = ?', [result.insertId]);

      throw new Error('Hiba a felhasznAlA3 regisztrAlAsakor');

    }



    // MeghAvA3 elfogadAsAnak jelAlAse

    await acceptStylistInvitation(token);



    console.log('a Stylist fully registered and invitation accepted');



    res.json({ 

      success: true, 

      message: 'Sikeres regisztrAciA3! Most mAr bejelentkezhetsz.',

      salon: invitation.invited_by_salon

    });

    

  } catch (error) {

    console.error('a Stylist registration error:', error.message);

    

    if (error.code === 'ER_DUP_ENTRY') {

      return res.status(400).json({ error: 'Ez az email cAm mAr regisztrAlva van' });

    }

    

    if (error.code === 'ER_NO_SUCH_TABLE') {

      return res.status(500).json({ error: 'AdatbAzis hiba. KArjA14k, prA3bAld Aojra kAsAbb.' });

    }

    

    res.status(500).json({ error: 'Hiba a regisztrAciA3 sorAn: ' + error.message });

  }

});



module.exports = router;

