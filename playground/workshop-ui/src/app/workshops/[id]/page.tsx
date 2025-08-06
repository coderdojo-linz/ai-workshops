'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from '../page.module.css';
import { WorkshopSchema } from '@/lib/workshop-schema';

interface Workshop {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
}

export default function EditWorkshopPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/workshops/${id}`)
      .then(res => res.json())
      .then(data => {
        setWorkshop(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    const res = await fetch(`/api/workshops/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workshop),
    });

    if (res.ok) {
      router.push('/workshops');
    } else {
      alert('Fehler beim Speichern');
    }
  }

  async function handleDelete() {
    const confirmed = confirm('Willst du diesen Workshop wirklich löschen?');
    if (!confirmed) return;

    const res = await fetch(`/api/workshops/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      router.push('/workshops');
    } else {
      alert('Fehler beim Löschen');
    }
  }

  if (loading) return <p className={styles.pageTitle}>Lade...</p>;
  if (!workshop) return <p className={styles.pageTitle}>Workshop nicht gefunden</p>;

  return (
    <main className={styles.pageWrapper}>
      <h1 className={styles.pageTitle}>Workshop bearbeiten</h1>

      <div className={styles.formWrapper}>
        <input
          type="text"
          value={workshop.title}
          onChange={e => setWorkshop({ ...workshop, title: e.target.value })}
          className={styles.input}
        />
        <input
          type="date"
          value={workshop.date}
          onChange={e => setWorkshop({ ...workshop, date: e.target.value })}
          className={styles.input}
        />
        <div className={styles.timeRow}>
          <input
            type="time"
            value={workshop.startTime}
            onChange={e => setWorkshop({ ...workshop, startTime: e.target.value })}
            className={styles.input}
          />
          <input
            type="time"
            value={workshop.endTime}
            onChange={e => setWorkshop({ ...workshop, endTime: e.target.value })}
            className={styles.input}
          />
        </div>
        <textarea
          value={workshop.description}
          onChange={e => setWorkshop({ ...workshop, description: e.target.value })}
          className={styles.textarea}
        />

        <div className={styles.editButtonsRow}>
          <button onClick={handleSave} className={styles.saveButton}>
            Speichern
          </button>
          <button onClick={() => router.push('/workshops')} className={styles.cancelButton}>
            Abbrechen
          </button>
          <button onClick={handleDelete} className={styles.deleteButton}>
          Workshop LÖSCHEN
          </button>
        </div>
      </div>
    </main>
  );
}
