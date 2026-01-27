// server/src/routes/dashboard/team.js
const router = require('express').Router();
const { connectToSalonDatabase } = require('../../../database/database');
const { inviteStylistToCentral, addStaffToCentralDirectory } = require('../../../database/database');
const { sendTeamInvitationEmail } = require('../../services/emailService');
const { ensureSalonDb, errorHandler } = require('./middleware');

// Csapat lekérése
router.get('/team', ensureSalonDb, async (req, res) => {
  try {
    const managementDbName = `${req.user.salon_db_name}_management`;
    const db = await connectToSalonDatabase(managementDbName);
    
    console.log('📍 Loading team from MANAGEMENT database:', managementDbName);
    
    const [team] = await db.promise().execute(`
      SELECT id, first_name, last_name, email, role, is_active
      FROM staff 
      WHERE is_active = TRUE 
      ORDER BY first_name, last_name
    `);
    
    const formattedTeam = team.map(member => ({
      id: member.id,
      name: `${member.first_name} ${member.last_name}`.trim(),
      email: member.email,
      specialty: 'Fodrász',
      role: member.role,
      is_active: member.is_active
    }));
    
    console.log(`✅ Team loaded from MANAGEMENT: ${formattedTeam.length} members`);
    res.json(formattedTeam);
  } catch (error) {
    console.error('❌ Team get error:', error.message);
    
    // Fallback: próbáljuk a salon adatbázist
    if (error.code === 'ER_BAD_DB_ERROR' || error.code === 'ER_NO_SUCH_TABLE') {
      try {
        console.log('🔄 Trying salon database instead...');
        const db = await connectToSalonDatabase(req.user.salon_db_name);
        const [team] = await db.promise().execute(`
          SELECT id, name, email, specialty, role 
          FROM users 
          WHERE is_active = TRUE 
          ORDER BY name
        `);
        console.log(`✅ Team loaded from SALON: ${team.length} members`);
        return res.json(team);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError.message);
      }
    }
    
    res.json([]);
  }
});

// Új csapattag meghívása
router.post('/team', ensureSalonDb, async (req, res) => {
  try {
    const { name, specialty, email, role } = req.body;
    
    console.log('👥 Inviting team member:', { name, email, role });
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Név és email megadása kötelező' });
    }

    // Meghívó mentése token-nel
    let invitationToken;
    try {
      invitationToken = await inviteStylistToCentral({
        email: email,
        invited_by_salon: req.user.salon_db_name,
        salon_db_name: req.user.salon_db_name,
        management_db_name: `${req.user.salon_db_name}_management`,
        invited_role: role || 'stylist'
      });
      
      console.log('✅ Invitation saved with token');
      
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Ez az email cím már meg van hívva' });
      }
      throw dbError;
    }

    // Email küldése token-nel
    try {
      const salonName = req.user.salon_db_name.replace('salon_', '').replace(/_/g, ' ');
      const formattedSalonName = salonName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      await sendTeamInvitationEmail(
        email, 
        formattedSalonName, 
        req.user.email,
        invitationToken
      );
      
      console.log('✅ Email with token sent successfully');
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      // Itt lehetne törölni a meghívót, ha az email nem sikerült
    }
    
    res.json({ 
      success: true, 
      message: 'Meghívó sikeresen elküldve! A stylist most regisztrálhat a kapott linkkel.'
    });
    
  } catch (error) {
    errorHandler(res, error, 'Hiba a meghívó küldésekor');
  }
});

// Csapattag törlése (soft delete)
router.delete('/team/:id', ensureSalonDb, async (req, res) => {
  try {
    const { id } = req.params;
    const managementDbName = `${req.user.salon_db_name}_management`;
    const db = await connectToSalonDatabase(managementDbName);
    
    await db.promise().execute(
      `UPDATE staff SET is_active = FALSE WHERE id = ?`,
      [id]
    );
    
    res.json({ success: true, message: 'Csapattag sikeresen törölve' });
  } catch (error) {
    errorHandler(res, error, 'Hiba a csapattag törlésekor');
  }
});

module.exports = router;