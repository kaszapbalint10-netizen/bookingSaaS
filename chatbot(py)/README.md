## Python Telegram Chatbot – Multi‑Salon Assistant

This folder contains a **multi‑salon Telegram chatbot** that:

- Uses a **MySQL database** to manage guests, bookings and salon data.
- Integrates with **Google Calendar** to automatically create / update bookings.
- Optionally uses **Gemini AI** to understand natural‑language user messages.
- Can run multiple **Telegram bots** (salons) in parallel from a single process.

---

## Main directories and responsibilities

- **`chatbot/`**
  - `main.py`: main entry point that starts multiple bots (multi‑bot version).
  - `config.py`: loads configuration from `.env` (Gemini key, salon list, tokens, calendar IDs).
  - `modules/ai/`: AI logic
    - `hybrid_extractor.py`: hybrid Gemini + rule‑based information extraction.
    - `info_extractor.py`: purely rule‑based (works without any AI key).
    - `response_generator.py`, `smart_response_generator.py`: response generation.
  - `modules/handlers/`: Telegram command and message handlers (`/start`, booking, opening hours, etc.).
  - `modules/database/`: higher‑level DB operations (events, users).
  - `modules/conversation/`: conversation state and context management.
- **`backend/`**
  - `database/mysql_module.py`: MySQL connection (host, user, password, default DB).
  - `database/table_operations.py`: per‑salon table creation / schema management.
  - `database/event_operations.py`, `salon_operations.py`, `user_operations.py`: CRUD operations.
  - `calendar/google_calendar.py`: Google Calendar API integration.
  - `calendar/monitor.py`: calendar monitoring and change syncing.
  - `security/`: input validation, rate limiting.
  - `shared/`: shared helpers (time utilities, etc.).

---

## Prerequisites

- **Python 3.10+**
- **MySQL/MariaDB** server (reachable from where the chatbot runs)
- **Google Cloud project**:
  - with a Service Account JSON key
  - with Google Calendar API enabled
- **Telegram bot(s)**:
  - one bot per salon, each with its own token from BotFather
- Optional: **Gemini API key** if you want AI‑powered understanding

---

## Installation

1. **Enter the directory:**

   ```bash
   cd "chatbot(py)"
   ```

2. **Install dependencies:**

   (Assumes the file is named `requirements.txt`; if it differs, use the file present in the project.)

   ```bash
   pip install -r requirements.txt
   ```

3. **Python module path setup:**

   `chatbot/main.py` already ensures that `backend` and `chatbot` modules are importable:
   - it adds the current directory and the backend’s parent directory to `sys.path`.

---

## Configuration

### 1. Database settings

The MySQL connection is currently hard‑coded in `backend/database/mysql_module.py`:

```python
DB_HOST = "192.168.112.102"
DB_USER = "test1"
DB_PASS = "test1"
GLOBAL_DB_NAME = "users"
```

Update these to match your environment:

- **`DB_HOST`**: database server address (e.g. `localhost` or a server IP).
- **`DB_USER`** / **`DB_PASS`**: MySQL user and password.
- **`GLOBAL_DB_NAME`**: name of the global database (e.g. where shared user / salon tables live).

Each salon’s own database is created / updated by `table_operations.initialize_salon_database(salon_name)` during `main.py` startup.

### 2. Google Calendar settings

Google Calendar integration lives in `backend/calendar/google_calendar.py`:

```python
SERVICE_ACCOUNT_FILE = "d:/wired-victor-472511-g0-1512c0260e32.json"
SCOPES = ["https://www.googleapis.com/auth/calendar"]
```

Update:

- **`SERVICE_ACCOUNT_FILE`**: path to your own service account JSON file.
- Add the service account to each calendar the bot should manage (e.g. with “editor” permission).

Each salon needs a **`calendar_id`** (e.g. `xxxx@group.calendar.google.com`) configured as described below.

### 3. .env and salon configs (`config.py`)

`chatbot/config.py` loads config from `.env`:

- **`GEMINI_API_KEY`** – optional, for AI‑based processing.
- **`GEMINI_MODEL`** – optional, e.g. `gemini-2.0-flash`.
- **`SALON_NAMES`** – comma‑separated list of salon names.
- Per salon:
  - `<SALON_NAME>_TOKEN`
  - `<SALON_NAME>_DATABASE`
  - `<SALON_NAME>_CALENDAR_ID`
  - `<SALON_NAME>_SERVICE_ACCOUNT_FILE`

Example `.env`:

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

> **Note:** The current multi‑bot `chatbot/main.py` also loads a `config.json` file from the same directory. Long‑term, it’s a good idea to standardize on either `.env` or `config.json`; in this README we recommend using the `.env`‑based approach.

### 4. config.json (if you use it)

`chatbot/main.py` can read per‑salon configs from `config.json`. Recommended structure (example):

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

`main.py` treats each key whose value is an object containing a `token` field as a salon configuration.

---

## Running the bot

1. **Make sure that:**
   - The MySQL database is running and `mysql_module.py` settings are correct.
   - `.env` (and/or `config.json`) is properly configured.
   - The Google service account JSON path is valid and has access to the calendars.

2. **Start:**

   ```bash
   cd "chatbot(py)"
   python -m chatbot.main
   # or
   python chatbot/main.py
   ```

On startup:

- **For each salon**, database initialization (`initialize_salon_database`) runs.
- **Telegram bot applications** are created (`ApplicationBuilder`).
- The **AI service** is configured (Gemini if key is present; otherwise rule‑based).
- **Google Calendar monitors** are started (for salons with a `calendar_id`).

---

## Key features (overview)

- **Commands** (examples – see `modules/handlers/commands_base.py` for the full list):
  - `/start` – welcome message and basic info.
  - `/idopont` – quick appointment command.
  - `/nyitvatartas` – opening hours.
  - `/help` – help / support.
- **Free‑text messages**:
  - The user writes a normal message (e.g. “I’d like an appointment on Friday afternoon”).
  - `handle_intelligent_message` uses AI/rules to interpret and suggest appointment times.
  - The booking is **stored in the database**, and optionally a **Google Calendar event** is created.

---

## Troubleshooting

- **No salon configuration loaded**
  - Check that `SALON_NAMES` is filled correctly in `.env`.
  - Check that each listed salon has a `<NAME>_TOKEN` defined.
- **DB connection error**
  - Verify the settings in `mysql_module.py`.
  - Try connecting via a separate MySQL client with the same host/user/pass.
- **Google Calendar errors**
  - Verify the `SERVICE_ACCOUNT_FILE` path.
  - Ensure the service account is added to the calendars being used.
- **Telegram import or startup errors**
  - Make sure all required packages are installed (e.g. `python-telegram-bot` with a compatible version).
  - Check that there is no leftover webhook / configuration from a previous deployment blocking your bot.

---

## Extending and customizing

- **Add a new salon**:
  - Add its name to `SALON_NAMES`.
  - Configure its token/db/calendar environment variables or `config.json` entry.
  - Restart the app – the new salon’s bot will start automatically.
- **Add a new command**:
  - Implement the handler function under `modules/handlers`.
  - Register it in `setup_handlers` in `main.py`.
- **Change / refine AI logic**:
  - Modify `modules/ai/hybrid_extractor.py` or `info_extractor.py`.
  - Switch to a different model via `.env` (`GEMINI_MODEL`).

This README gives you a single place to understand how the **Telegram chatbot** works end‑to‑end and what you need to get it running.



