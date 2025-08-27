'use client';

import React, { useState } from 'react';
import type { ZodFormattedError } from 'zod';

import { WorkshopSchema, type WorkshopInput } from '@/lib/workshop-schema';

import styles from '@/app/workshops/page.module.css';

interface WorkshopFormProps {
  initialWorkshop?: WorkshopInput & { id?: number; code?: string };
  onSave: (workshop: WorkshopInput & { id?: number }) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

export default function WorkshopForm({ initialWorkshop, onSave, onCancel, onDelete }: Readonly<WorkshopFormProps>) {
  const [loading, setLoading] = useState(false);
  const [workshop, setWorkshop] = useState<WorkshopInput>({
    title: initialWorkshop?.title ?? '',
    startDateTime: initialWorkshop?.startDateTime ? initialWorkshop.startDateTime.slice(0,16) : '',
    endDateTime: initialWorkshop?.endDateTime ? initialWorkshop.endDateTime.slice(0,16) : '',
    description: initialWorkshop?.description ?? '',
  });

  const validation = WorkshopSchema.safeParse(workshop);
  const errors: ZodFormattedError<WorkshopInput> = validation.success ? ({} as any) : validation.error.format();

  async function handleSubmit() {
    if (!validation.success) return;
    setLoading(true);
    try {
      await onSave({ ...workshop, id: initialWorkshop?.id });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.formWrapper}>
      <input
        type="text"
        name="title"
        placeholder="Titel"
        value={workshop.title}
        onChange={e => setWorkshop({ ...workshop, title: e.target.value })}
        className={styles.input}
      />
      {errors.title && <div className={styles.errorText}>{errors.title._errors.join(', ')}</div>}

      <div className={styles.dateTimeRow}>
        <label htmlFor="startDateTime">Startdatum und -uhrzeit</label>
        <input
          type="datetime-local"
          name="startDateTime"
          value={workshop.startDateTime}
          onChange={e => setWorkshop({ ...workshop, startDateTime: e.target.value })}
          className={styles.input}
          min={new Date().toISOString().slice(0,16)}
        />
        {errors.startDateTime && <div className={styles.errorText}>{errors.startDateTime._errors.join(', ')}</div>}
        <label htmlFor="endDateTime">Enddatum und -uhrzeit</label>
        <input
          type="datetime-local"
          name="endDateTime"
          value={workshop.endDateTime}
          onChange={e => setWorkshop({ ...workshop, endDateTime: e.target.value })}
          className={styles.input}
        />
        {errors.endDateTime && <div className={styles.errorText}>{errors.endDateTime._errors.join(', ')}</div>}
      </div>

      <textarea
        name="description"
        placeholder="Beschreibung"
        value={workshop.description}
        onChange={e => setWorkshop({ ...workshop, description: e.target.value })}
        className={styles.textarea}
      />
      {errors.description && <div className={styles.errorText}>{errors.description._errors.join(', ')}</div>}

      <div className={styles.editButtonsRow}>
        <button onClick={handleSubmit} disabled={!validation.success || loading} className={styles.saveButton}>
          {initialWorkshop ? 'Speichern' : 'Workshop erstellen'}
        </button>
        <button onClick={onCancel} className={styles.cancelButton} type="button">
          Abbrechen
        </button>
        {initialWorkshop && onDelete && (
          <button
            onClick={onDelete}
            disabled={loading}
            className={styles.deleteButton}
            type="button"
          >
            Workshop LÖSCHEN
          </button>
        )}
      </div>
    </div>
  );
}
