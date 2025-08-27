import Link from 'next/link';
import styles from './page.module.css';
import { getExercises } from '@/lib/exercise-file-manager';
import { trace } from '@opentelemetry/api';
import LogoutButton from '@/components/LogoutButton';
import { getAppSession, validateAppSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function Home() {
  // redirect to login if not authenticated
  const isAuthenticated = await validateAppSession(await getAppSession());
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
  const exercisesData = exercisesResult.value.exercises;

  function difficultyToClass(difficulty: string) {
    switch (difficulty) {
      case 'easy':
        return styles.easy;
      case 'medium':
        return styles.medium;
      case 'hard':
        return styles.hard;
      default:
        return '';
    }
  }

  function difficultyToName(difficulty: string) {
    switch (difficulty) {
      case 'easy':
        return 'Beginner';
      case 'medium':
        return 'Advanced';
      case 'hard':
        return 'Expert';
      default:
        return '';
    }
  }

  return (
    <>
      <LogoutButton className={styles.logoutContainer} />
      <img src="/images/background1.svg" alt="Decorative image" className={styles.vectorBg1} />
      <img src="/images/background2.svg" alt="Decorative image" className={styles.vectorBg2} />
      <div className={styles.container}>
        <h1 className={styles.title}>AI Workshop Exercises</h1>
        <div className={styles.exerciseGrid}>
          {Object.entries(exercisesData).map(([key, exercise]) => (
            <div key={key} className={styles.exerciseCard}>
              <Link href={exercise.url ?? `/chat/${key}`} className={styles.exerciseLink}>
                <span className={`${styles.exerciseDifficulty} ${difficultyToClass(exercise.difficulty)}`}>{difficultyToName(exercise.difficulty)}</span>
                <img src={exercise.image || '/images/elementor-placeholder-image.png'} alt={`${exercise.title}'s descriptive image`} />
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
