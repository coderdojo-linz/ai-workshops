'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import WorkshopForm from '@/components/WorkshopForm';
import type { WorkshopInput } from '@/lib/workshop-schema';
import { Clipboard, ClipboardCheck, Pencil } from 'lucide-react';
import { th } from 'zod/v4/locales';
interface Workshop {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  code: string;
}

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState({
    geplant: true,
    'läuft gerade': true,
    beendet: false
  });
  const router = useRouter();

  const workshopsPerPage = 10;
  
  // Filtere Workshops basierend auf Status
  const filteredWorkshops = workshops.filter(w => {
    const status = getWorkshopStatus(w);
    return statusFilter[status.text as keyof typeof statusFilter];
  });
  
  const totalPages = Math.ceil(filteredWorkshops.length / workshopsPerPage);
  const startIndex = (currentPage - 1) * workshopsPerPage;
  const endIndex = startIndex + workshopsPerPage;
  const currentWorkshops = filteredWorkshops.slice(startIndex, endIndex);

  useEffect(() => {
    setLoading(true);
    fetch('/api/workshops')
      .then(async res => {
        if (res.status === 401) {
          // Wenn 401 Unauthorized, weiterleiten zur Login-Seite
          router.push('/login?from=/');
          throw new Error('Nicht autorisiert');
        }
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
    setCurrentPage(1); // Zurück zur ersten Seite nach dem Erstellen
  }

  async function copyCodeToClipboard(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000); // Reset nach 2 Sekunden
    } catch (err) {
      console.error('Fehler beim Kopieren:', err);
    }
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

      {/* Button und Filter nebeneinander, nur wenn Formular nicht sichtbar */}
      {!formVisible && (
        <div className={styles.topControls}>
          <button onClick={() => setFormVisible(true)} className={styles.newWorkshopButton}>
            + Neuer Workshop
          </button>
          
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Filter nach Status:</h3>
            <div className={styles.filterCheckboxes}>
              {Object.entries(statusFilter).map(([status, isChecked]) => (
                <label key={status} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      setStatusFilter(prev => ({
                        ...prev,
                        [status]: e.target.checked
                      }));
                      setCurrentPage(1); // Zurück zur ersten Seite beim Filtern
                    }}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>{status}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
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
              <th>Code</th>
              <th>Datum</th>
              <th>Zeit</th>
              <th>Status</th>
              <th>Beschreibung</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {currentWorkshops.map(w => {
              const status = getWorkshopStatus(w);
              return (
                <tr key={w.id}>
                  <td className={styles.workshopTitle}>{w.title}</td>
                  <td className={styles.codeCell}>
                    <div className={styles.codeContent}>
                      <span className={styles.codeText}>{w.code}</span>
                      <button 
                        className={styles.copyButton}
                        onClick={() => copyCodeToClipboard(w.code)}
                        title="Code kopieren"
                      >
                        {copiedCode === w.code ? <ClipboardCheck /> : <Clipboard/>}
                      </button>
                    </div>
                  </td>
                  <td>{w.date}</td>
                  <td>{w.startTime} - {w.endTime}</td>
                  <td><span className={status.className}>{status.text}</span></td>
                <td>{w.description}</td>
                <td>
                  <button className={styles.editButton} onClick={() => router.push(`/workshops/${w.id}`)}>
                    <Pencil />
                  </button>
                </td>
              </tr>
              );
})}
            {currentWorkshops.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>Keine Workshops vorhanden</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            ← Zurück
          </button>
          
          <span className={styles.paginationInfo}>
            Seite {currentPage} von {totalPages} ({filteredWorkshops.length} von {workshops.length} Workshops)
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Vor →
          </button>
        </div>
      )}
    </main>
  );
}
