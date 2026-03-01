import db from './db';

export enum PermissionLevel {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export interface FormPermission {
  level: PermissionLevel;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canManageCollaborators: boolean;
}

/**
 * Get the permission level for a user on a form.
 * Returns the FormPermission object or null if the user has no access.
 */
export function getFormPermission(formId: number, userId: number): FormPermission | null {
  // First check if the user is the form owner (from forms table)
  const form = db.prepare('SELECT user_id FROM forms WHERE id = ?').get(formId) as { user_id: number } | undefined;

  if (!form) {
    return null; // Form doesn't exist
  }

  // If the user is the form creator, they are the owner
  if (form.user_id === userId) {
    return {
      level: PermissionLevel.OWNER,
      canEdit: true,
      canDelete: true,
      canView: true,
      canManageCollaborators: true
    };
  }

  // Check if the user is a collaborator
  const collaborator = db.prepare(
    'SELECT permission_level FROM form_collaborators WHERE form_id = ? AND user_id = ?'
  ).get(formId, userId) as { permission_level: string } | undefined;

  if (!collaborator) {
    return null; // No access
  }

  switch (collaborator.permission_level) {
    case PermissionLevel.EDITOR:
      return {
        level: PermissionLevel.EDITOR,
        canEdit: true,
        canDelete: false,
        canView: true,
        canManageCollaborators: false
      };
    case PermissionLevel.VIEWER:
      return {
        level: PermissionLevel.VIEWER,
        canEdit: false,
        canDelete: false,
        canView: true,
        canManageCollaborators: false
      };
    default:
      return null;
  }
}

/**
 * Check if a user can edit a form.
 */
export function canEditForm(formId: number, userId: number): boolean {
  const permission = getFormPermission(formId, userId);
  return permission?.canEdit ?? false;
}

/**
 * Check if a user can delete a form.
 */
export function canDeleteForm(formId: number, userId: number): boolean {
  const permission = getFormPermission(formId, userId);
  return permission?.canDelete ?? false;
}

/**
 * Check if a user can manage collaborators on a form.
 */
export function canManageCollaborators(formId: number, userId: number): boolean {
  const permission = getFormPermission(formId, userId);
  return permission?.canManageCollaborators ?? false;
}

/**
 * Check if a user can view a form.
 */
export function canViewForm(formId: number, userId: number): boolean {
  const permission = getFormPermission(formId, userId);
  return permission?.canView ?? false;
}

/**
 * Get all collaborators for a form.
 */
export function getFormCollaborators(formId: number) {
  const collaborators = db.prepare(`
    SELECT fc.id, fc.user_id, fc.permission_level, fc.added_at,
           u.email, u.name
    FROM form_collaborators fc
    JOIN users u ON fc.user_id = u.id
    WHERE fc.form_id = ?
    ORDER BY fc.added_at DESC
  `).all(formId);

  return collaborators;
}

/**
 * Add a collaborator to a form.
 */
export function addCollaborator(formId: number, userId: number, permissionLevel: PermissionLevel): boolean {
  try {
    db.prepare(
      'INSERT INTO form_collaborators (form_id, user_id, permission_level) VALUES (?, ?, ?)'
    ).run(formId, userId, permissionLevel);
    return true;
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return false;
  }
}

/**
 * Update a collaborator's permission level.
 */
export function updateCollaboratorPermission(formId: number, userId: number, permissionLevel: PermissionLevel): boolean {
  const result = db.prepare(
    'UPDATE form_collaborators SET permission_level = ? WHERE form_id = ? AND user_id = ?'
  ).run(permissionLevel, formId, userId);
  return result.changes > 0;
}

/**
 * Remove a collaborator from a form.
 */
export function removeCollaborator(formId: number, userId: number): boolean {
  const result = db.prepare(
    'DELETE FROM form_collaborators WHERE form_id = ? AND user_id = ?'
  ).run(formId, userId);
  return result.changes > 0;
}
