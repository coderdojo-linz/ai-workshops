'use client';

import React, { useState } from 'react';
import styles from '@/app/workshops/page.module.css';
import { WorkshopSchema, type WorkshopInput } from '@/lib/workshop-schema';
import type { ZodFormattedError } from 'zod';

interface WorkshopFormProps {
  initialWorkshop?: WorkshopInput & { id?: number };
  onSave: (workshop: WorkshopInput & { id?: number }) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

export default function WorkshopForm({ initialWorkshop, onSave, onCancel, onDelete }: WorkshopFormProps) {
  const [workshop, setWorkshop] = useState<WorkshopInput>({
    title: initialWorkshop?.title ?? '',
    date: initialWorkshop?.date ?? '',
    startTime: initialWorkshop?.startTime ?? '',
    endTime: initialWorkshop?.endTime ?? '',
    description: initialWorkshop?.description ?? '',
  });

  const [loading, setLoading] = useState(false);

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
      {errors?.title?._errors?.[0] && <p className={styles.error}>{errors.title._errors[0]}</p>}

      <input
        type="date"
        name="date"
        value={workshop.date}
        onChange={e => setWorkshop({ ...workshop, date: e.target.value })}
        className={styles.input}
      />

      <div className={styles.timeRow}>
        <input
          type="time"
          name="startTime"
          value={workshop.startTime}
          onChange={e => setWorkshop({ ...workshop, startTime: e.target.value })}
          className={styles.input}
        />
        <input
          type="time"
          name="endTime"
          value={workshop.endTime}
          onChange={e => setWorkshop({ ...workshop, endTime: e.target.value })}
          className={styles.input}
        />
      </div>

      <textarea
        name="description"
        placeholder="Beschreibung"
        value={workshop.description}
        onChange={e => setWorkshop({ ...workshop, description: e.target.value })}
        className={styles.textarea}
      />

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
