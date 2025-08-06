'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

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
  const [newWorkshop, setNewWorkshop] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    description: '',
  });

  const router = useRouter();

  useEffect(() => {
    fetch('/api/workshops')
      .then(res => res.json())
      .then(data => setWorkshops(data));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setNewWorkshop({ ...newWorkshop, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    const res = await fetch('/api/workshops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWorkshop),
    });
    const created = await res.json();
    setWorkshops(prev => [...prev, created]);
    setFormVisible(false);
    setNewWorkshop({ title: '', date: '', startTime: '', endTime: '', description: '' });
  }

  function getWorkshopStatus(w: Workshop): string {
    const now = new Date();
    const start = new Date(`${w.date}T${w.startTime}`);
    const end = new Date(`${w.date}T${w.endTime}`);
    if (now < start) return 'geplant';
    if (now >= start && now <= end) return 'läuft gerade';
    return 'beendet';
  }

  return (
    <main className={styles.pageWrapper}>
      <h1 className={styles.pageTitle}>Workshops</h1>

      <button
        onClick={() => setFormVisible(!formVisible)}
        className={styles.newWorkshopButton}
      >
        + Neuer Workshop
      </button>

      {formVisible && (
        <div className={styles.formWrapper}>
          <input type="text" name="title" placeholder="Titel" value={newWorkshop.title} onChange={handleChange} className={styles.input} />
          <input type="date" name="date" value={newWorkshop.date} onChange={handleChange} className={styles.input} />
          <div className={styles.timeRow}>
            <input type="time" name="startTime" value={newWorkshop.startTime} onChange={handleChange} className={styles.input} />
            <input type="time" name="endTime" value={newWorkshop.endTime} onChange={handleChange} className={styles.input} />
          </div>
          <textarea name="description" placeholder="Beschreibung" value={newWorkshop.description} onChange={handleChange} className={styles.textarea} />
          <button onClick={handleSubmit} className={styles.submitButton}>Workshop erstellen</button>
        </div>
      )}

      <div className={styles.workshopList}>
        {workshops.map(w => (
          <div key={w.id} className={styles.workshopCard}>
            <div className={styles.workshopHeader}>
              <h2 className={styles.workshopTitle}>{w.title}</h2>
              <div className={styles.workshopActions}>
                <span className={styles.workshopStatus}>{getWorkshopStatus(w)}</span>
                <button
                  className={styles.editButton}
                  onClick={() => router.push(`/workshops/${w.id}`)}
                >
                  Bearbeiten
                </button>
              </div>
            </div>
            <p className={styles.workshopDate}>
              📅 {w.date} 🕒 {w.startTime} - {w.endTime}
            </p>
            <p className={styles.workshopDescription}>{w.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
