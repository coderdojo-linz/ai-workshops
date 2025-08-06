'use client';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

/*export default function Home() {
  return (
    <h1>Workshops (TODO!)</h1>
  );
}*/

// File: src/app/workshops/page.tsx

interface Workshop {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  status: string;
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

  useEffect(() => {
    fetch('/api/workshops')
      .then(res => res.json())
      .then(data => {
        console.log('workshops:', data);
        setWorkshops(data);
      });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setNewWorkshop({ ...newWorkshop, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    const payload = {
      ...newWorkshop,
      status: 'ausstehend',  //TODO Dynamisch Status laden
    };
    const res = await fetch('/api/workshops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const created = await res.json();
    setWorkshops(prev => [...prev, created]);
    setFormVisible(false);
    setNewWorkshop({ title: '', date: '', startTime: '', endTime: '', description: '' });
  }

  return (
    <main className="min-h-screen bg-orange-50 p-8">
      <h1 className="text-2xl font-bold mb-4">Workshops</h1>
      <button
        onClick={() => setFormVisible(!formVisible)}
        className="bg-orange-500 text-white px-4 py-2 rounded mb-4"
      >
        + Neuer Workshop
      </button>

      {formVisible && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <input
            type="text"
            name="title"
            placeholder="Workshop Name"
            value={newWorkshop.title}
            onChange={handleChange}
            className="border p-2 w-full mb-2"
          />
          <input
            type="date"
            name="date"
            value={newWorkshop.date}
            onChange={handleChange}
            className="border p-2 w-full mb-2"
          />
          <div className="flex gap-2 mb-2">
            <input
              type="time"
              name="startTime"
              value={newWorkshop.startTime}
              onChange={handleChange}
              className="border p-2 w-full"
            />
            <input
              type="time"
              name="endTime"
              value={newWorkshop.endTime}
              onChange={handleChange}
              className="border p-2 w-full"
            />
          </div>
          <textarea
            name="description"
            value={newWorkshop.description}
            onChange={handleChange}
            placeholder="Beschreibung"
            className="border p-2 w-full mb-2"
          />
          <button
            onClick={handleSubmit}
            className="bg-orange-500 text-white px-4 py-2 rounded"
          >
            Workshop erstellen
          </button>
        </div>
      )}

      <div className={styles.workshopList}>
        {workshops.map(w => (
          <div key={w.id} className={styles.workshopCard}>
            <div className={styles.workshopHeader}>
              <h2 className={styles.workshopTitle}>{w.title}</h2>
              <div className={styles.workshopActions}>
                <span className={styles.workshopStatus}>{w.status}</span>
                <button className={styles.editButton}>Bearbeiten</button>
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
