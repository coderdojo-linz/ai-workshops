'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import WorkshopForm from '@/components/WorkshopForm';
import type { WorkshopInput } from '@/lib/workshop-schema';

interface Workshop {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
}

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch('/api/workshops')
      .then(async res => {
        if (!res.ok) throw new Error('Fehler beim Laden der Workshops');
        return res.json();
      })
      .then((data: Workshop[]) => setWorkshops(data))
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  async function createWorkshop(payload: WorkshopInput) {
    const res = await fetch('/api/workshops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'Fehler beim Erstellen des Workshops');
    }
    const created: Workshop = await res.json();
    setWorkshops(prev => [...prev, created]);
    setFormVisible(false);
  }

 function getWorkshopStatus(w: Workshop): { text: string; className: string } {
  const now = new Date();
  const start = new Date(`${w.date}T${w.startTime}`);
  const end = new Date(`${w.date}T${w.endTime}`);

  if (now < start) return { text: 'geplant', className: styles.statusPlanned };
  if (now >= start && now <= end) return { text: 'läuft gerade', className: styles.statusOngoing };
  return { text: 'beendet', className: styles.statusFinished };
}

  if (loading) return <main className={styles.pageWrapper}><p className={styles.pageTitle}>Lade...</p></main>;
  if (error) return <main className={styles.pageWrapper}><p className={styles.pageTitle}>Fehler: {error}</p></main>;

  return (
    <main className={styles.pageWrapper}>
      <h1 className={styles.pageTitle}>Workshops</h1>

    {!formVisible && (
  <button onClick={() => setFormVisible(true)} className={styles.newWorkshopButton}>
    + Neuer Workshop
  </button>
)}


      {formVisible && (
        <WorkshopForm
          onSave={async (payload) => {
            try {
              await createWorkshop(payload as WorkshopInput);
            } catch (e) {
              alert(String(e) || 'Fehler beim Erstellen');
            }
          }}
          onCancel={() => setFormVisible(false)}
        />
      )}

      <div className={styles.workshopTableWrapper}>
        <table className={styles.workshopTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Datum</th>
              <th>Zeit</th>
              <th>Status</th>
              <th>Beschreibung</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {workshops.map(w => {
              const status = getWorkshopStatus(w);
              return (
                <tr key={w.id}>
                  <td className={styles.workshopTitle}>{w.title}</td>
                  <td>{w.date}</td>
                  <td>{w.startTime} - {w.endTime}</td>
                  <td><span className={status.className}>{status.text}</span></td>
                <td>{w.description}</td>
                <td>
                  <button className={styles.editButton} onClick={() => router.push(`/workshops/${w.id}`)}>
                    Bearbeiten
                  </button>
                </td>
              </tr>
              );
})}
            {workshops.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>Keine Workshops vorhanden</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
