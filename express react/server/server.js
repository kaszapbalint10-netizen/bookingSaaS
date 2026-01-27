require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createConnection } = require('./database');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// API kulcs ellenőrzése
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY nincs beállítva a .env fájlban!');
} else {
  console.log('✅ Gemini API kulcs betöltve');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JSON konfigurációk betöltése
// JSON konfigurációk betöltése - JAVÍTOTT VERZIÓ
const loadConfig = (configType, fileName) => {
  try {
    const configPath = path.join(__dirname, 'config', configType, `${fileName}.json`);
    if (!fs.existsSync(configPath)) {
      console.warn(`⚠️ ${configType}/${fileName}.json fájl nem található`);
      return null;
    }
    
    const fileContent = fs.readFileSync(configPath, 'utf8');
    if (!fileContent.trim()) {
      console.warn(`⚠️ ${configType}/${fileName}.json fájl üres`);
      return null;
    }
    
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`❌ ${configType}/${fileName} konfiguráció betöltési hiba:`, error.message);
    return null;
  }
};

const loadAllAssistants = () => {
  const assistants = {};
  const configPath = path.join(__dirname, 'config', 'assistants');
  
  try {
    if (!fs.existsSync(configPath)) {
      console.warn('⚠️ config/assistants mappa nem található');
      return {};
    }
    
    const files = fs.readdirSync(configPath);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const assistantType = file.replace('.json', '');
        const config = loadConfig('assistants', assistantType);
        if (config) {
          assistants[assistantType] = config;
        }
      }
    });
    return assistants;
  } catch (error) {
    console.error('❌ Asszisztensek betöltési hiba:', error.message);
    return {};
  }
};

// Adatbázis inicializálása
let db;
async function initializeDatabase() {
  try {
    db = await createConnection();
    console.log('✅ MySQL adatbázis csatlakozva');
    
    // Táblák létrehozása
    await db.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        assistant_type VARCHAR(50) NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        booking_data JSON NOT NULL,
        status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Bookings tábla kész');
    
  } catch (error) {
    console.error('❌ Adatbázis inicializálási hiba:', error);
  }
}

initializeDatabase();

// Ár kalkulátor
const calculatePrice = (assistantType, bookingData) => {
  const pricing = loadConfig('pricing', `${assistantType}-pricing`);
  if (!pricing) return null;

  switch (assistantType) {
    case 'car-rental':
      const basePrice = pricing.categories[bookingData.car_type]?.base_price || 10000;
      let totalPrice = basePrice * bookingData.days;
      
      // Kedvezmények
      if (bookingData.days > pricing.discounts.monthly.days) {
        totalPrice *= (1 - pricing.discounts.monthly.percent / 100);
      } else if (bookingData.days > pricing.discounts.weekly.days) {
        totalPrice *= (1 - pricing.discounts.weekly.percent / 100);
      }
      
      // Extra költségek
      if (bookingData.pickup_location !== bookingData.return_location) {
        totalPrice += pricing.extra_fees.one_way;
      }
      
      return Math.round(totalPrice);

    case 'travel':
      // Utazási ár számítás
      const base = pricing.categories[bookingData.package_type]?.base_price || 50000;
      return base * bookingData.travelers;

    default:
      return 0;
  }
};

// Asszisztens chat endpoint
app.post('/api/assistants/:type/chat', async (req, res) => {
  try {
    const { type } = req.params;
    const { message, conversation_history = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Üzenet szükséges' });
    }

    const assistantConfig = loadConfig('assistants', type);
    if (!assistantConfig || !assistantConfig.is_active) {
      return res.status(404).json({ error: 'Asszisztens nem található' });
    }

    // Dinamikus prompt összeállítás
    const systemPrompt = buildSystemPrompt(assistantConfig, conversation_history, message);
    
    console.log(`🤖 ${assistantConfig.name} kérés:`, message.substring(0, 50) + '...');
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Intent analysis
    const intent = analyzeIntent(type, message, text);
    
    res.json({ 
      reply: text,
      intent: intent,
      suggestions: generateSuggestions(type, intent),
      assistant: {
        name: assistantConfig.name,
        type: type,
        quick_actions: assistantConfig.quick_actions
      }
    });
    
  } catch (error) {
    console.error('❌ Asszisztens hiba:', error);
    res.status(500).json({ 
      error: 'Sajnálom, technikai hiba történt. Kérlek, próbáld újra kicsit később.',
      details: error.message 
    });
  }
});

// Prompt builder
function buildSystemPrompt(config, history, message) {
  let prompt = config.system_prompt;
  
  // Konverzációs történet hozzáadása
  if (history.length > 0) {
    prompt += `\n\nKORÁBBI BESZÉLGETÉS:\n${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;
  }
  
  prompt += `\n\nFELHASZNÁLÓ KÉRDÉSE: ${message}\n\nASSZISZTENS VÁLASZA:`;
  
  return prompt;
}

// Intent analysis - BŐVÍTETT VERZIÓ
function analyzeIntent(assistantType, userMessage, aiResponse) {
  const userMessageLower = userMessage.toLowerCase();
  const aiResponseLower = aiResponse.toLowerCase();
  
  const bookingKeywords = {
    'car-rental': ['foglalni', 'bérelni', 'autót szeretnék', 'lefoglalni'],
    'nail-salon': ['foglalni', 'időpontot', 'körmöshöz', 'kezelésre'],
    'hair-salon': ['foglalni', 'időpontot', 'fodrászhoz', 'frizura'],
    'cosmetologist': ['foglalni', 'időpontot', 'kozmetikushoz', 'kezelésre'],
    'masseur': ['foglalni', 'időpontot', 'masszőrhöz', 'masszázsra']
  };
  
  const keywords = bookingKeywords[assistantType] || [];
  const wantsToBook = keywords.some(keyword => 
    userMessageLower.includes(keyword) || aiResponseLower.includes('foglalás') || aiResponseLower.includes('időpont')
  );
  
  return wantsToBook ? 'booking' : 'inquiry';
}

// Suggestions generator - BŐVÍTETT VERZIÓ
function generateSuggestions(assistantType, intent) {
  const suggestions = {
    'car-rental': {
      inquiry: ['🚗 Autók listája', '💰 Árak', '📍 Helyszínek', '❓ Feltételek'],
      booking: ['📋 Foglalási adatok', '💰 Árajánlat', '📞 Visszahívás', 'ℹ️ Részletek']
    },
    'nail-salon': {
      inquiry: ['💅 Szolgáltatások', '💰 Árak', '👩‍💼 Körmösök', '🕒 Nyitvatartás'],
      booking: ['📋 Időpont foglalás', '💰 Árajánlat', '👩‍💼 Szakember választás', 'ℹ️ Részletek']
    },
    'hair-salon': {
      inquiry: ['💇‍♀️ Szolgáltatások', '💰 Árak', '👨‍💼 Fodrászok', '🎨 Stílus tanács'],
      booking: ['📋 Időpont foglalás', '💰 Árajánlat', '👨‍💼 Fodrász választás', 'ℹ️ Részletek']
    },
    'cosmetologist': {
      inquiry: ['💆‍♀️ Kezelések', '💰 Árak', '👩‍⚕️ Kozmetikusok', '🌟 Bőrtanács'],
      booking: ['📋 Időpont foglalás', '💰 Árajánlat', '👩‍⚕️ Szakember választás', 'ℹ️ Részletek']
    },
    'masseur': {
      inquiry: ['💆‍♂️ Masszázs típusok', '💰 Árak', '👨‍⚕️ Masszőrök', '🏃‍♀️ Sport tanács'],
      booking: ['📋 Időpont foglalás', '💰 Árajánlat', '👨‍⚕️ Szakember választás', 'ℹ️ Részletek']
    }
  };
  
  return suggestions[assistantType]?.[intent] || ['ℹ️ További információk'];
}

// Összes asszisztens listázása
app.get('/api/assistants', (req, res) => {
  const assistants = loadAllAssistants();
  const activeAssistants = Object.entries(assistants)
    .filter(([_, config]) => config.is_active)
    .map(([type, config]) => ({
      type: type,
      name: config.name,
      description: config.description,
      features: config.features,
      quick_actions: config.quick_actions
    }));
  
  res.json(activeAssistants);
});

// Asszisztens adatok lekérése
app.get('/api/assistants/:type', (req, res) => {
  const assistantConfig = loadConfig('assistants', req.params.type);
  if (!assistantConfig || !assistantConfig.is_active) {
    return res.status(404).json({ error: 'Asszisztens nem található' });
  }
  
  res.json({
    type: req.params.type,
    name: assistantConfig.name,
    description: assistantConfig.description,
    features: assistantConfig.features,
    quick_actions: assistantConfig.quick_actions
  });
});

// Árak lekérése
app.get('/api/assistants/:type/pricing', (req, res) => {
  const pricing = loadConfig('pricing', `${req.params.type}-pricing`);
  if (!pricing) {
    return res.status(404).json({ error: 'Árazás nem található' });
  }
  
  res.json(pricing);
});

// Adatok lekérése (autók, úticélok, ingatlanok)
app.get('/api/assistants/:type/data', (req, res) => {
  const data = loadConfig('data', req.params.type);
  if (!data) {
    return res.status(404).json({ error: 'Adatok nem találhatók' });
  }
  
  res.json(data);
});

// Ár kalkulátor endpoint
app.post('/api/assistants/:type/calculate-price', (req, res) => {
  const { booking_data } = req.body;
  const price = calculatePrice(req.params.type, booking_data);
  
  if (price === null) {
    return res.status(400).json({ error: 'Árszámítási hiba' });
  }
  
  res.json({
    total_price: price,
    currency: 'HUF',
    assistant_type: req.params.type
  });
});

// Foglalás rögzítése
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      assistant_type,
      customer_name,
      email,
      phone,
      booking_data
    } = req.body;

    const [result] = await db.execute(
      `INSERT INTO bookings 
      (assistant_type, customer_name, email, phone, booking_data, status) 
      VALUES (?, ?, ?, ?, ?, 'pending')`,
      [assistant_type, customer_name, email, phone, JSON.stringify(booking_data)]
    );

    res.status(201).json({
      message: 'Foglalás sikeresen rögzítve!',
      booking_id: result.insertId,
      status: 'pending',
      assistant_type: assistant_type
    });
    
  } catch (error) {
    console.error('❌ Foglalási hiba:', error);
    res.status(500).json({ error: 'Foglalási hiba' });
  }
});

// Foglalások lekérése
app.get('/api/bookings', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM bookings ORDER BY created_at DESC');
    
    // JSON adatok parse-olása
    const bookings = rows.map(row => ({
      ...row,
      booking_data: JSON.parse(row.booking_data)
    }));
    
    res.json(bookings);
  } catch (error) {
    console.error('❌ Foglalások lekérése hiba:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  const assistants = loadAllAssistants();
  const activeAssistants = Object.keys(assistants).filter(type => assistants[type].is_active);
  
  res.json({ 
    status: 'OK', 
    service: 'Multi-Assistant API',
    timestamp: new Date().toISOString(),
    active_assistants: activeAssistants,
    database: db ? 'Connected' : 'Disconnected'
  });
});

// Szerver indítása
app.listen(PORT, () => {
  const assistants = loadAllAssistants();
  const activeAssistants = Object.keys(assistants).filter(type => assistants[type].is_active);
  
  console.log(`🚀 Multi-Asszisztens szerver fut: http://localhost:${PORT}`);
  console.log(`📋 Aktív asszisztensek: ${activeAssistants.join(', ')}`);
  console.log(`🤖 Asszisztensek API: http://localhost:${PORT}/api/assistants`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/assistants/:type/chat`);
  console.log(`💰 Árazás: http://localhost:${PORT}/api/assistants/:type/pricing`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  
  activeAssistants.forEach(type => {
    console.log(`   → ${assistants[type].name}: http://localhost:${PORT}/api/assistants/${type}/chat`);
  });
});