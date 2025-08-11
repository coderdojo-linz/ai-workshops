import Link from 'next/link';
import styles from './page.module.css';
import { getExercises } from '@/lib/exercise-file-manager';
import { trace } from '@opentelemetry/api';

export default async function Home() {
  const exercisesResult = await getExercises();
  if (!exercisesResult.success) {
    const span = trace.getActiveSpan();
    span?.addEvent('exercises_file_validation_error', { error: exercisesResult.error.error });
    return <div>Error loading exercises</div>;
  }
  const exercisesData = exercisesResult.value.exercises;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>AI Workshop Exercises</h1>
      <div className={styles.exerciseGrid}>
        {Object.entries(exercisesData).map(([key, exercise]) => (
          <div key={key} className={styles.exerciseCard}>
            <Link href={`/chat/${key}`} className={styles.exerciseLink}>
              <h2 className={styles.exerciseTitle}>{exercise.title}</h2>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
