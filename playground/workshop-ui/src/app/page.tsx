import Link from 'next/link';
import styles from './page.module.css';
import { getExercises } from '@/lib/exercise-file-manager';

export default async function Home() {
  const exercisesResult = await getExercises();
  if (!exercisesResult.success) {
    return <div>Error loading exercises</div>;
  }
  const exercisesData = exercisesResult.exercises;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>AI Workshop Exercises</h1>
      <div className={styles.exerciseGrid}>
        {Object.entries(exercisesData.exercises).map(([key, exercise]) => (
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
