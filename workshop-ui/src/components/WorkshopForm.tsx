'use client';

import React, { useState, useEffect } from 'react';
import type { ZodFormattedError } from 'zod';

import { WorkshopSchema, type WorkshopInput } from '@/lib/workshop-schema';

import styles from './WorkshopForm.module.css';

interface WorkshopFormProps {
  initialWorkshop?: WorkshopInput & { id?: number; code?: string };
  onSave: (workshop: WorkshopInput & { id?: number }) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

type ExerciseListItem = {
  title: string;
};

type ExercisesResponse = {
  exercises: Record<string, ExerciseListItem>;
};

export default function WorkshopForm({ initialWorkshop, onSave, onCancel, onDelete }: Readonly<WorkshopFormProps>) {
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<ExercisesResponse | null>(null);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [workshop, setWorkshop] = useState<WorkshopInput>({
    title: initialWorkshop?.title ?? '',
    startDateTime: initialWorkshop?.startDateTime ? initialWorkshop.startDateTime.slice(0,16) : '',
    endDateTime: initialWorkshop?.endDateTime ? initialWorkshop.endDateTime.slice(0,16) : '',
    description: initialWorkshop?.description ?? '',
    exerciseCodes: initialWorkshop?.exerciseCodes ?? [],
  });

  useEffect(() => {
    // Load exercises list
    fetch('/api/exercises')
      .then(async res => {
        if (!res.ok) throw new Error('Failed to load exercises');
        return res.json();
      })
      .then((data: ExercisesResponse) => setExercises(data))
      .catch(err => console.error('Error loading exercises:', err))
      .finally(() => setExercisesLoading(false));
  }, []);

  const validation = WorkshopSchema.safeParse(workshop);
  const errors: ZodFormattedError<WorkshopInput> = validation.success ? ({} as any) : validation.error.format();

  const toggleExercise = (exerciseCode: string) => {
    const currentCodes = workshop.exerciseCodes ?? [];
    const newCodes = currentCodes.includes(exerciseCode)
      ? currentCodes.filter(code => code !== exerciseCode)
      : [...currentCodes, exerciseCode];
    // Send empty array instead of undefined, so the API can detect when clearing all exercises
    setWorkshop({ ...workshop, exerciseCodes: newCodes.length > 0 ? newCodes : [] });
  };

  const setEndTimeFromStart = (hours: number) => {
    if (!workshop.startDateTime) return;
    // Parse the datetime-local string (format: YYYY-MM-DDTHH:mm)
    // Work directly with the string format to avoid timezone issues
    const [datePart, timePart] = workshop.startDateTime.split('T');
    if (!datePart || !timePart) return;
    
    // Parse time components
    const [hoursStr, minutesStr] = timePart.split(':');
    const startHours = parseInt(hoursStr, 10);
    const startMinutes = parseInt(minutesStr, 10);
    
    // Parse date components
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Add hours (handle day/month/year overflow)
    let endHours = startHours + hours;
    let endDay = day;
    let endMonth = month;
    let endYear = year;
    
    // If hours overflow past 24, add a day
    if (endHours >= 24) {
      endHours = endHours - 24;
      endDay = endDay + 1;
      
      // Handle month overflow (simplified - assumes all months have 31 days max)
      const daysInMonth = new Date(year, month, 0).getDate();
      if (endDay > daysInMonth) {
        endDay = 1;
        endMonth = endMonth + 1;
        
        // Handle year overflow
        if (endMonth > 12) {
          endMonth = 1;
          endYear = endYear + 1;
        }
      }
    }
    
    // Format back to YYYY-MM-DDTHH:mm format (all in local time, no timezone conversion)
    const formattedDate = `${endYear}-${endMonth.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`;
    const formattedHours = endHours.toString().padStart(2, '0');
    const formattedMinutes = minutesStr.padStart(2, '0');
    const formatted = `${formattedDate}T${formattedHours}:${formattedMinutes}`;
    
    setWorkshop({ ...workshop, endDateTime: formatted });
  };

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
      <div className={styles.inputWrapper}>
        <input
          type="text"
          name="title"
          placeholder="Titel"
          value={workshop.title}
          onChange={e => setWorkshop({ ...workshop, title: e.target.value })}
          className={styles.input}
        />
        {errors.title && <div className={styles.errorText}>{errors.title._errors.join(', ')}</div>}
      </div>

      <div className={styles.dateTimeRow}>
        <div className={styles.dateTimeField}>
          <label htmlFor="startDateTime">Startdatum und -uhrzeit</label>
          <input
            type="datetime-local"
            name="startDateTime"
            id="startDateTime"
            value={workshop.startDateTime}
            onChange={e => setWorkshop({ ...workshop, startDateTime: e.target.value })}
            className={styles.input}
            min={new Date().toISOString().slice(0,16)}
          />
          {errors.startDateTime && <div className={styles.errorText}>{errors.startDateTime._errors.join(', ')}</div>}
        </div>
        <div className={styles.dateTimeField}>
          <label htmlFor="endDateTime">Enddatum und -uhrzeit</label>
          <div className={styles.endDateTimeGroup}>
            <input
              type="datetime-local"
              name="endDateTime"
              id="endDateTime"
              value={workshop.endDateTime}
              onChange={e => setWorkshop({ ...workshop, endDateTime: e.target.value })}
              className={styles.input}
            />
            <div className={styles.quickTimeButtons}>
              <button
                type="button"
                onClick={() => setEndTimeFromStart(1)}
                disabled={!workshop.startDateTime}
                className={styles.quickTimeButton}
                title="Endzeit auf Startzeit + 1 Stunde setzen"
              >
                Start+1h
              </button>
              <button
                type="button"
                onClick={() => setEndTimeFromStart(2)}
                disabled={!workshop.startDateTime}
                className={styles.quickTimeButton}
                title="Endzeit auf Startzeit + 2 Stunden setzen"
              >
                Start+2h
              </button>
            </div>
          </div>
          {errors.endDateTime && <div className={styles.errorText}>{errors.endDateTime._errors.join(', ')}</div>}
        </div>
      </div>

      <div className={styles.textareaWrapper}>
        <textarea
          name="description"
          placeholder="Beschreibung"
          value={workshop.description}
          onChange={e => setWorkshop({ ...workshop, description: e.target.value })}
          className={styles.textarea}
        />
        {errors.description && <div className={styles.errorText}>{errors.description._errors.join(', ')}</div>}
      </div>

      {!exercisesLoading && exercises && (
        <div className={styles.exerciseSection}>
          <label className={styles.exerciseSectionLabel}>
            Übungen für diesen Workshop:
          </label>
          <div className={styles.exerciseListContainer}>
            {Object.entries(exercises.exercises).map(([code, exercise]) => (
              <label key={code} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={(workshop.exerciseCodes ?? []).includes(code)}
                  onChange={() => toggleExercise(code)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>{exercise.title}</span>
              </label>
            ))}
          </div>
          <p className={styles.helpText}>
            Wenn keine Übungen ausgewählt sind, werden die Standard-Übungen (visibleByDefault=true) verwendet.
          </p>
        </div>
      )}

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
