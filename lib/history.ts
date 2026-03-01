import db from './db';

export interface HistoryEntry {
  id: number;
  form_id: number;
  user_id: number;
  user_email?: string;
  user_name?: string;
  action: string;
  changes?: any;
  created_at: string;
}

/**
 * Record a form change in the history.
 */
export function recordFormChange(formId: number, userId: number, action: string, changes?: any): boolean {
  try {
    db.prepare(
      'INSERT INTO form_history (form_id, user_id, action, changes) VALUES (?, ?, ?, ?)'
    ).run(formId, userId, action, changes ? JSON.stringify(changes) : null);
    return true;
  } catch (error) {
    console.error('Error recording form change:', error);
    return false;
  }
}

/**
 * Get the history for a form.
 */
export function getFormHistory(formId: number, limit: number = 50): HistoryEntry[] {
  const history = db.prepare(`
    SELECT fh.id, fh.form_id, fh.user_id, fh.action, fh.changes, fh.created_at,
           u.email as user_email, u.name as user_name
    FROM form_history fh
    LEFT JOIN users u ON fh.user_id = u.id
    WHERE fh.form_id = ?
    ORDER BY fh.created_at DESC
    LIMIT ?
  `).all(formId, limit) as any[];

  return history.map((entry: any) => ({
    ...entry,
    changes: entry.changes ? JSON.parse(entry.changes) : null
  }));
}

/**
 * Get the total count of history entries for a form.
 */
export function getFormHistoryCount(formId: number): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM form_history WHERE form_id = ?').get(formId) as { count: number };
  return result.count;
}

/**
 * Delete old history entries for a form (keep only the most recent N entries).
 */
export function cleanupOldHistory(formId: number, keepCount: number = 100): boolean {
  try {
    const history = db.prepare(`
      SELECT id FROM form_history WHERE form_id = ? ORDER BY created_at DESC LIMIT -1 OFFSET ?
    `).all(formId, keepCount) as { id: number }[];

    if (history.length > 0) {
      const idsToDelete = history.map(h => h.id);
      const placeholders = idsToDelete.map(() => '?').join(',');
      db.prepare(`DELETE FROM form_history WHERE id IN (${placeholders})`).run(...idsToDelete);
    }
    return true;
  } catch (error) {
    console.error('Error cleaning up old history:', error);
    return false;
  }
}
