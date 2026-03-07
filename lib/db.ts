import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'formflow.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create forms table
db.exec(`
  CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_open INTEGER DEFAULT 1,
    deadline DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Create questions table
db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    options TEXT,
    required INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL,
    condition_question_id INTEGER,
    condition_value TEXT,
    condition_operator TEXT DEFAULT 'equals',
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  )
`);

// Migration: Add condition columns if they don't exist (for existing databases)
try {
  const columns = db.pragma('table_info(questions)');
  const columnNames = columns.map((col: any) => col.name);

  if (!columnNames.includes('condition_question_id')) {
    db.exec('ALTER TABLE questions ADD COLUMN condition_question_id INTEGER');
  }
  if (!columnNames.includes('condition_value')) {
    db.exec('ALTER TABLE questions ADD COLUMN condition_value TEXT');
  }
  if (!columnNames.includes('condition_operator')) {
    db.exec("ALTER TABLE questions ADD COLUMN condition_operator TEXT DEFAULT 'equals'");
  }
} catch (error) {
  // Columns might already exist, ignore error
  console.log('Migration check completed');
}

// Migration: Add deadline column to forms table if it doesn't exist
try {
  const formColumns = db.pragma('table_info(forms)');
  const formColumnNames = formColumns.map((col: any) => col.name);

  if (!formColumnNames.includes('deadline')) {
    db.exec('ALTER TABLE forms ADD COLUMN deadline DATETIME');
  }
} catch (error) {
  console.log('Forms migration check completed');
}

// Create templates table
db.exec(`
  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'custom',
    questions TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_preset INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Create saved forms from templates table (user can save their forms as templates)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    form_id INTEGER,
    template_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  )
`);

// Create responses table
db.exec(`
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  )
`);

// Create answers table
db.exec(`
  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    response_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer TEXT,
    FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  )
`);

// Create survey_invitations table for email invitations
db.exec(`
  CREATE TABLE IF NOT EXISTS survey_invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    status TEXT DEFAULT 'pending',
    sent_at DATETIME,
    responded_at DATETIME,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  )
`);

// Migration: Add survey_invitations table if it doesn't exist
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='survey_invitations'").get();
  if (!tables) {
    db.exec(`
      CREATE TABLE survey_invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        status TEXT DEFAULT 'pending',
        sent_at DATETIME,
        responded_at DATETIME,
        reminder_count INTEGER DEFAULT 0,
        last_reminder_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
      )
    `);
  }
} catch (error) {
  console.log('Survey invitations migration check completed');
}

// Create draft_responses table for auto-saving progress
db.exec(`
  CREATE TABLE IF NOT EXISTS draft_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,
    answers TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  )
`);

// Create index for faster lookups
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_draft_responses_form_session
  ON draft_responses(form_id, session_id)
`);

// Migration: Add draft_responses table if it doesn't exist
try {
  const draftTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='draft_responses'").get();
  if (!draftTables) {
    db.exec(`
      CREATE TABLE draft_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        answers TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
      )
    `);
    db.exec(`
      CREATE INDEX idx_draft_responses_form_session
      ON draft_responses(form_id, session_id)
    `);
  }
} catch (error) {
  console.log('Draft responses migration check completed');
}

// Migration: Add location columns to responses table for geographic statistics
try {
  const responseColumns = db.pragma('table_info(responses)');
  const responseColumnNames = responseColumns.map((col: any) => col.name);

  if (!responseColumnNames.includes('country')) {
    db.exec('ALTER TABLE responses ADD COLUMN country TEXT');
  }
  if (!responseColumnNames.includes('city')) {
    db.exec('ALTER TABLE responses ADD COLUMN city TEXT');
  }
  if (!responseColumnNames.includes('latitude')) {
    db.exec('ALTER TABLE responses ADD COLUMN latitude REAL');
  }
  if (!responseColumnNames.includes('longitude')) {
    db.exec('ALTER TABLE responses ADD COLUMN longitude REAL');
  }
} catch (error) {
  console.log('Location columns migration check completed');
}

// Migration: Add category column to forms table for classification
try {
  const formColumns = db.pragma('table_info(forms)');
  const formColumnNames = formColumns.map((col: any) => col.name);

  if (!formColumnNames.includes('category')) {
    db.exec("ALTER TABLE forms ADD COLUMN category TEXT DEFAULT 'other'");
  }
} catch (error) {
  console.log('Category column migration check completed');
}

// Create form_tags table for tag filtering
db.exec(`
  CREATE TABLE IF NOT EXISTS form_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    UNIQUE(form_id, tag)
  )
`);

// Create index for faster tag lookups
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_form_tags_tag ON form_tags(tag)
`);

// Migration: Ensure form_tags table exists (for existing databases)
try {
  const tagTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='form_tags'").get();
  if (!tagTables) {
    db.exec(`
      CREATE TABLE form_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL,
        tag TEXT NOT NULL,
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
        UNIQUE(form_id, tag)
      )
    `);
    db.exec(`
      CREATE INDEX idx_form_tags_tag ON form_tags(tag)
    `);
  }
} catch (error) {
  console.log('Form tags migration check completed');
}

// Create form_collaborators table for collaboration
db.exec(`
  CREATE TABLE IF NOT EXISTS form_collaborators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    permission_level TEXT NOT NULL CHECK (permission_level IN ('owner', 'editor', 'viewer')),
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(form_id, user_id)
  )
`);

// Migration: Ensure form_collaborators table exists (for existing databases)
try {
  const collabTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='form_collaborators'").get();
  if (!collabTables) {
    db.exec(`
      CREATE TABLE form_collaborators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        permission_level TEXT NOT NULL CHECK (permission_level IN ('owner', 'editor', 'viewer')),
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(form_id, user_id)
      )
    `);
  }
} catch (error) {
  console.log('Form collaborators migration check completed');
}

// Create form_history table for change tracking
db.exec(`
  CREATE TABLE IF NOT EXISTS form_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    changes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Migration: Ensure form_history table exists (for existing databases)
try {
  const historyTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='form_history'").get();
  if (!historyTables) {
    db.exec(`
      CREATE TABLE form_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        changes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }
} catch (error) {
  console.log('Form history migration check completed');
}

// Migration: Add notification settings columns to forms table
try {
  const formColumns = db.pragma('table_info(forms)');
  const formColumnNames = formColumns.map((col: any) => col.name);

  if (!formColumnNames.includes('notify_on_response')) {
    db.exec('ALTER TABLE forms ADD COLUMN notify_on_response INTEGER DEFAULT 1');
  }
  if (!formColumnNames.includes('notify_deadline_reminder')) {
    db.exec('ALTER TABLE forms ADD COLUMN notify_deadline_reminder INTEGER DEFAULT 1');
  }
  if (!formColumnNames.includes('deadline_reminder_days')) {
    db.exec("ALTER TABLE forms ADD COLUMN deadline_reminder_days TEXT DEFAULT '1,3'");
  }
  if (!formColumnNames.includes('notify_goal_achievement')) {
    db.exec('ALTER TABLE forms ADD COLUMN notify_goal_achievement INTEGER DEFAULT 0');
  }
  if (!formColumnNames.includes('response_goal')) {
    db.exec('ALTER TABLE forms ADD COLUMN response_goal INTEGER');
  }
  if (!formColumnNames.includes('goal_notification_sent')) {
    db.exec('ALTER TABLE forms ADD COLUMN goal_notification_sent INTEGER DEFAULT 0');
  }
  if (!formColumnNames.includes('last_notification_at')) {
    db.exec('ALTER TABLE forms ADD COLUMN last_notification_at DATETIME');
  }
} catch (error) {
  console.log('Notification settings migration check completed');
}

// Create notification_history table
db.exec(`
  CREATE TABLE IF NOT EXISTS notification_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'sent',
    error_message TEXT,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  )
`);

// Create index for notification_history
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_notification_history_form_sent
  ON notification_history(form_id, sent_at)
`);

// Migration: Ensure notification_history table exists
try {
  const notifHistoryTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='notification_history'").get();
  if (!notifHistoryTables) {
    db.exec(`
      CREATE TABLE notification_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL,
        notification_type TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'sent',
        error_message TEXT,
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
      )
    `);
    db.exec(`
      CREATE INDEX idx_notification_history_form_sent
      ON notification_history(form_id, sent_at)
    `);
  }
} catch (error) {
  console.log('Notification history migration check completed');
}

// Create scheduled_jobs table for background tasks
db.exec(`
  CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    job_type TEXT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_attempt_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  )
`);

// Create index for scheduled_jobs
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_status_scheduled
  ON scheduled_jobs(status, scheduled_at)
`);

// Migration: Ensure scheduled_jobs table exists
try {
  const scheduledJobsTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='scheduled_jobs'").get();
  if (!scheduledJobsTables) {
    db.exec(`
      CREATE TABLE scheduled_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL,
        job_type TEXT NOT NULL,
        scheduled_at DATETIME NOT NULL,
        status TEXT DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        last_attempt_at DATETIME,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
      )
    `);
    db.exec(`
      CREATE INDEX idx_scheduled_jobs_status_scheduled
      ON scheduled_jobs(status, scheduled_at)
    `);
  }
} catch (error) {
  console.log('Scheduled jobs migration check completed');
}

// Migration: Add branding columns to forms table for customization
try {
  const formColumns = db.pragma('table_info(forms)');
  const formColumnNames = formColumns.map((col: any) => col.name);

  if (!formColumnNames.includes('logo_url')) {
    db.exec('ALTER TABLE forms ADD COLUMN logo_url TEXT');
  }
  if (!formColumnNames.includes('primary_color')) {
    db.exec("ALTER TABLE forms ADD COLUMN primary_color TEXT DEFAULT '#7C3AED'");
  }
  if (!formColumnNames.includes('secondary_color')) {
    db.exec("ALTER TABLE forms ADD COLUMN secondary_color TEXT DEFAULT '#4F46E5'");
  }
  if (!formColumnNames.includes('background_color')) {
    db.exec("ALTER TABLE forms ADD COLUMN background_color TEXT DEFAULT '#FFFFFF'");
  }
  if (!formColumnNames.includes('text_color')) {
    db.exec("ALTER TABLE forms ADD COLUMN text_color TEXT DEFAULT '#1F2937'");
  }
  if (!formColumnNames.includes('background_image_url')) {
    db.exec('ALTER TABLE forms ADD COLUMN background_image_url TEXT');
  }
  if (!formColumnNames.includes('background_image_position')) {
    db.exec("ALTER TABLE forms ADD COLUMN background_image_position TEXT DEFAULT 'center'");
  }
  if (!formColumnNames.includes('background_image_size')) {
    db.exec("ALTER TABLE forms ADD COLUMN background_image_size TEXT DEFAULT 'cover'");
  }
  if (!formColumnNames.includes('completion_message')) {
    db.exec("ALTER TABLE forms ADD COLUMN completion_message TEXT DEFAULT '응답해 주셔서 감사합니다!'");
  }
  if (!formColumnNames.includes('completion_image_url')) {
    db.exec('ALTER TABLE forms ADD COLUMN completion_image_url TEXT');
  }
  if (!formColumnNames.includes('completion_button_text')) {
    db.exec("ALTER TABLE forms ADD COLUMN completion_button_text TEXT DEFAULT '목록으로'");
  }
  if (!formColumnNames.includes('completion_button_url')) {
    db.exec('ALTER TABLE forms ADD COLUMN completion_button_url TEXT');
  }
  if (!formColumnNames.includes('show_completion_image')) {
    db.exec('ALTER TABLE forms ADD COLUMN show_completion_image INTEGER DEFAULT 0');
  }
} catch (error) {
  console.log('Branding columns migration check completed');
}

export default db;
