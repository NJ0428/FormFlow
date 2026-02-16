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

export default db;
