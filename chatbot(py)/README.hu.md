## Python Telegram Chatbot – Többszalonos asszisztens

Ez a mappa egy **több szalont kiszolgáló Telegram chatbotot** tartalmaz, amely:

- **MySQL adatbázist** használ a vendégek, időpontok és szalonadatok kezelésére.
- **Google Calendar** integrációval automatikusan létrehozza / frissíti a foglalásokat.
- Opcionálisan **Gemini AI**‑t használ a természetes nyelvű üzenetek értelmezésére.
- Több **Telegram botot** (szalont) tud egyszerre futtatni ugyanabból az alkalmazásból.

---

## Fő mappák és szerepük

- **`chatbot/`**
  - `main.py`: több botot indító főbelépési pont (multi‑bot verzió).
  - `config.py`: konfigurációk betöltése `.env` fájlból (Gemini kulcs, szalon lista, tokenek, naptár ID‑k).
  - `modules/ai/`: AI‑logika
    - `hybrid_extractor.py`: Gemini + szabályalapú hibrid információkinyerés.
    - `info_extractor.py`: tisztán szabályalapú (AI kulcs nélkül is működik).
    - `response_generator.py`, `smart_response_generator.py`: válaszgenerálás.
  - `modules/handlers/`: Telegram parancs‑ és üzenetkezelők (`/start`, időpont, nyitvatartás, stb.).
  - `modules/database/`: magasabb szintű DB‑műveletek (események, felhasználók).
  - `modules/conversation/`: beszélgetés állapot‑ és kontextuskezelés.
- **`backend/`**
  - `database/mysql_module.py`: MySQL kapcsolat (host, user, jelszó, alap DB).
  - `database/table_operations.py`: táblák létrehozása/sémakezelés szalononként.
  - `database/event_operations.py`, `salon_operations.py`, `user_operations.py`: CRUD műveletek.
  - `calendar/google_calendar.py`: Google Calendar API integráció.
  - `calendar/monitor.py`: naptárfigyelés, változások szinkronizálása.
  - `security/`: bemeneti validáció, rate limiting.
  - `shared/`: közös segédfüggvények (időkezelés, stb.).

---

## Előfeltételek

- **Python 3.10+**
- **MySQL/MariaDB** szerver (elérhető a chatbot szerveréről)
- **Google Cloud projekt**:
  - Service Account JSON kulccsal
  - Engedélyezett Google Calendar API
- **Telegram bot(ok)**:
  - Mindegyik szalonhoz létrehozott bot, saját tokennel (BotFather‑tól)
- Opcionális: **Gemini API kulcs**, ha AI‑os értelmezést szeretnél

---

## Telepítés

1. **Lépj be a mappába:**

   ```bash
   cd "chatbot(py)"
   ```

2. **Függőségek telepítése:**

   (A fájlnév feltételezve `requirements.txt`; ha ettől eltér, a projektben lévő fájlt használd.)

   ```bash
   pip install -r requirements.txt
   ```

3. **Python modulútvonal ellenőrzése:**

   A `chatbot/main.py` már gondoskodik róla, hogy a `backend` és a `chatbot` modulok elérhetők legyenek:
   - `sys.path`‑be felveszi az aktuális mappát és a backend szülő mappáját.

---

## Konfiguráció

### 1. Adatbázis beállítás

A MySQL kapcsolat jelenleg a `backend/database/mysql_module.py` fájlban van “bedrótozva”:

```python
DB_HOST = "192.168.112.102"
DB_USER = "test1"
DB_PASS = "test1"
GLOBAL_DB_NAME = "users"
```

Tedd a saját környezetedhez illő értékekre:

- **`DB_HOST`**: adatbázis szerver címe (pl. `localhost` vagy szerver IP).
- **`DB_USER`** / **`DB_PASS`**: MySQL felhasználó és jelszó.
- **`GLOBAL_DB_NAME`**: központi adatbázis neve (pl. ahol a felhasználók / szalonok táblák vannak).

Az egyes szalonok saját adatbázisait a `table_operations.initialize_salon_database(salon_name)` hozza létre / frissíti a `main.py` indításakor.

### 2. Google Calendar beállítás

A Google Calendar integráció a `backend/calendar/google_calendar.py` fájlban van:

```python
SERVICE_ACCOUNT_FILE = "d:/wired-victor-472511-g0-1512c0260e32.json"
SCOPES = ["https://www.googleapis.com/auth/calendar"]
```

Állítsd be:

- **`SERVICE_ACCOUNT_FILE`**: a saját service account JSON fájlod elérési útvonala.
- A service account‑ot add hozzá minden olyan naptárhoz, amelyet a botnak kezelnie kell (pl. “szerkesztő” jogosultsággal).

Minden szalonhoz kell egy **`calendar_id`** (pl. `xxxx@group.calendar.google.com`), amit a konfigurációban adsz meg (lásd lejjebb).

### 3. .env és szalon konfigurációk (`config.py`)

A `chatbot/config.py` `.env`‑ből tölti be:

- **`GEMINI_API_KEY`** – opcionális, AI alapú feldolgozáshoz.
- **`GEMINI_MODEL`** – opcionális, pl. `gemini-2.0-flash`.
- **`SALON_NAMES`** – vesszővel elválasztott lista a szalon nevekről.
- Szalononként:
  - `<SALON_NAME>_TOKEN`
  - `<SALON_NAME>_DATABASE`
  - `<SALON_NAME>_CALENDAR_ID`
  - `<SALON_NAME>_SERVICE_ACCOUNT_FILE`

Példa `.env` fájl:

```env
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.0-flash

SALON_NAMES=salon1,salon2

SALON1_TOKEN=123456:ABC-telegram-bot-token
SALON1_DATABASE=salon1_db
SALON1_CALENDAR_ID=your_calendar_id_1@group.calendar.google.com
SALON1_SERVICE_ACCOUNT_FILE=C:/keys/salon1-service.json

SALON2_TOKEN=654321:XYZ-telegram-bot-token
SALON2_DATABASE=salon2_db
SALON2_CALENDAR_ID=your_calendar_id_2@group.calendar.google.com
SALON2_SERVICE_ACCOUNT_FILE=C:/keys/salon2-service.json
```

> **Fontos:** A `chatbot/main.py` jelenlegi multi‑bot verziója egy `config.json` fájlt is betölt ugyanebből a könyvtárból. Érdemes egységesen vagy `.env`‑re, vagy `config.json`‑ra átállni; README szinten azt javasoljuk, hogy a `.env`‑es megoldást használd hosszú távon.

### 4. config.json (ha használod)

A `chatbot/main.py` a `config.json`‑ból olvassa az egyes szalonok konfigját. Ajánlott szerkezet (példa):

```json
{
  "salon1": {
    "token": "123456:ABC-telegram-bot-token",
    "calendar_id": "your_calendar_id_1@group.calendar.google.com",
    "database": "salon1_db"
  },
  "salon2": {
    "token": "654321:XYZ-telegram-bot-token",
    "calendar_id": "your_calendar_id_2@group.calendar.google.com",
    "database": "salon2_db"
  }
}
```

A `main.py` minden olyan kulcsot szalonnak tekint, ahol az érték egy objektum, és tartalmaz `token` mezőt.

---

## Futtatás

1. **Bizonyosodj meg róla, hogy:**
   - MySQL adatbázis fut és a `mysql_module.py` beállításai helyesek.
   - A `.env` (és/vagy `config.json`) megfelelően be van állítva.
   - A Google service account JSON elérési út érvényes, és van jogosultsága a naptárakhoz.

2. **Indítás:**

   ```bash
   cd "chatbot(py)"
   python -m chatbot.main
   # vagy
   python chatbot/main.py
   ```

Indításkor:

- **Minden szalonhoz** lefut az adatbázis inicializálás (`initialize_salon_database`).
- Létrejönnek a **Telegram bot alkalmazások** (`ApplicationBuilder` alapján).
- Beállításra kerül az **AI szolgáltatás** (Gemini, ha van kulcs; különben szabályalapú).
- Elindulnak a **Google Calendar monitorok** (ahol van `calendar_id`).

---

## Fő funkciók (áttekintés)

- **Parancsok** (példa – pontos lista a `modules/handlers/commands_base.py`‑ben):
  - `/start` – köszöntő üzenet, alap információk.
  - `/idopont` – gyors időpontkérés.
  - `/nyitvatartas` – nyitvatartási információk.
  - `/help` – segítség / súgó.
- **Szabad szöveges üzenetek**:
  - A felhasználó “normál” üzenetet ír (pl. “Szeretnék péntek délutánra időpontot”).
  - A `handle_intelligent_message` az AI/szabályrendszer segítségével értelmezi és javasol időpontot.
  - Az időpontfoglalás **adatbázisba mentődik**, és opcionálisan **Google Calendar eseményt** is létrehoz.

---

## Hibaelhárítás

- **Nincs szalon konfiguráció betöltve**
  - Ellenőrizd, hogy a `.env`‑ben a `SALON_NAMES` helyesen van kitöltve.
  - Ellenőrizd, hogy minden felsorolt szalonhoz van `<NAME>_TOKEN` beállítva.
- **DB kapcsolat hiba**
  - Ellenőrizd a `mysql_module.py` beállításait.
  - Próbálj meg külön MySQL klienssel csatlakozni ugyanazzal a host/user/pass‑al.
- **Google Calendar hiba**
  - Ellenőrizd a `SERVICE_ACCOUNT_FILE` elérési útját.
  - Ellenőrizd, hogy a service account hozzá van‑e adva a használt naptárakhoz.
- **Telegram import vagy indítási hiba**
  - Győződj meg róla, hogy az összes szükséges csomag telepítve van (pl. `python-telegram-bot` megfelelő verzióval).
  - Ellenőrizd, hogy nincs múltbeli futásból maradt, blokkoló webhook/beállítás.

---

## Fejlesztés és bővítés

- **Új szalon hozzáadása**:
  - Adj hozzá új nevet a `SALON_NAMES`‑hez.
  - Állítsd be a hozzá tartozó token/db/calendar környezeti változókat vagy a `config.json` bejegyzést.
  - Indítsd újra az alkalmazást – az új szalon botja automatikusan elindul.
- **Új parancs hozzáadása**:
  - Hozd létre a handler függvényt a `modules/handlers` mappában.
  - Regisztráld a `setup_handlers` függvényben (`main.py`‑ben).
- **AI logika cseréje / finomítása**:
  - Módosítsd a `modules/ai/hybrid_extractor.py` vagy `info_extractor.py` fájlokat.
  - Állítsd be másik modellt a `.env`‑ben (`GEMINI_MODEL`). 

Ezzel a README‑vel egy helyen megtalálod a **Telegram chatbot** teljes működésének áttekintését és az induláshoz szükséges lépéseket.


