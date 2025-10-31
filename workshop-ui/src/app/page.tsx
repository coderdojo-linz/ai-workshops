import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { trace } from '@opentelemetry/api';

import { getExercises } from '@/lib/exercise-file-manager';
import { getAppSession, validateAppSession } from '@/lib/session';
import { readWorkshops } from '@/lib/workshopService';
import LogoutButton from '@/components/LogoutButton';

import styles from './page.module.css';

type Difficulty = {
  class: string;
  label: string;
}

export default async function Home() {
  // redirect to login if not authenticated
  const session = await getAppSession();
  const isAuthenticated = await validateAppSession(session);
  if (!isAuthenticated) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '/';
    redirect('/login?from=' + encodeURIComponent(pathname));
  }
  
  const exercisesResult = await getExercises();
  if (!exercisesResult.success) {
    const span = trace.getActiveSpan();
    span?.addEvent('exercises_file_validation_error', { error: exercisesResult.error.error });
    throw new Error('Failed to load exercises');
  }
  const allExercises = exercisesResult.value.exercises;

  // Get the workshop for this user
  const workshops = await readWorkshops();
  const workshop = workshops.find(w => w.code === session.accessCode);

  // Filter exercises based on workshop configuration
  let filteredExercises: typeof allExercises;
  if (workshop?.exerciseCodes && workshop.exerciseCodes.length > 0) {
    // If workshop has specific exercise codes, only show those
    filteredExercises = Object.fromEntries(
      Object.entries(allExercises).filter(([code]) => workshop.exerciseCodes!.includes(code))
    );
  } else {
    // If no exercise codes specified, show exercises with visibleByDefault=true (default)
    // visibleByDefault defaults to true if not specified, so we show exercises where it's not explicitly false
    filteredExercises = Object.fromEntries(
      Object.entries(allExercises).filter(([_, exercise]) => exercise.visibleByDefault !== false)
    );
  }

  function parseDifficulty(difficulty: string): Difficulty {
    switch (difficulty) {
      case 'easy':
        return { class: styles.easy, label: 'Einsteiger' };
      case 'medium':
        return { class: styles.medium, label: 'Fortgeschritten' };
      case 'hard':
        return { class: styles.hard, label: 'Experte' };
      default:
        return { class: '', label: '' };
    }
  }

  return (
    <>
      <LogoutButton className={styles.logoutContainer} />
      <img src="/images/background1.svg" alt="Dekoratives Bild" className={styles.vectorBg1} />
      <img src="/images/background2.svg" alt="Dekoratives Bild" className={styles.vectorBg2} />
      <div className={styles.container}>
        <h1 className={styles.title}>AI Workshopübungen</h1>
        <div className={styles.exerciseGrid}>
          {Object.entries(filteredExercises).map(([key, exercise]) => (
            <div key={key} className={styles.exerciseCard}>
              <Link href={exercise.url ?? `/chat/${key}`} className={styles.exerciseLink}>
                <span className={`${styles.exerciseDifficulty} ${parseDifficulty(exercise.difficulty).class}`}>{parseDifficulty(exercise.difficulty).label}</span>
                <img src={exercise.image || '/images/elementor-placeholder-image.png'} alt={`${exercise.title}'s beschreibendes Bild`} />
                <div className={styles.exerciseContent}>
                  <h2 className={styles.exerciseTitle}>{exercise.title}</h2>
                  <p className={styles.exerciseDescription}>{exercise.summary}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
