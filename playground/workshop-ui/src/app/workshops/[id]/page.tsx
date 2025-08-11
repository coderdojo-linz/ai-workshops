'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from '../page.module.css';
import WorkshopForm from '@/components/WorkshopForm';
import type { WorkshopInput } from '@/lib/workshop-schema';

interface Workshop {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  code: string;
}

export default function EditWorkshopPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/workshops/${id}`)
      .then(async res => {
        if (!res.ok) throw new Error('Workshop nicht gefunden');
        return res.json();
      })
      .then((data: Workshop) => setWorkshop(data))
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(payload: WorkshopInput & { id?: number }) {
    const res = await fetch(`/api/workshops/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      alert(txt || 'Fehler beim Speichern');
      return;
    }
    router.push('/workshops');
  }

  async function handleDelete() {
    const confirmed = confirm('Willst du diesen Workshop wirklich löschen?');
    if (!confirmed) return;
    const res = await fetch(`/api/workshops/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const txt = await res.text();
      alert(txt || 'Fehler beim Löschen');
      return;
    }
    router.push('/workshops');
  }

  if (loading) return <main className={styles.pageWrapper}><p className={styles.pageTitle}>Lade...</p></main>;
  if (error) return <main className={styles.pageWrapper}><p className={styles.pageTitle}>Fehler: {error}</p></main>;
  if (!workshop) return <main className={styles.pageWrapper}><p className={styles.pageTitle}>Workshop nicht gefunden</p></main>;

  return (
    <main className={styles.pageWrapper}>
      <h1 className={styles.pageTitle}>Workshop bearbeiten</h1>

      <WorkshopForm
        initialWorkshop={workshop}
        onSave={handleSave}
        onCancel={() => router.push('/workshops')}
        onDelete={handleDelete}
      />
    </main>
  );
}
