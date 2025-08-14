import Link from 'next/link';
import styles from './page.module.css';
import { getExercises } from '@/lib/exercise-file-manager';
import { trace } from '@opentelemetry/api';

export default async function Home() {
  const exercisesResult = await getExercises();
  if (!exercisesResult.success) {
    const span = trace.getActiveSpan();
    span?.addEvent('exercises_file_validation_error', { error: exercisesResult.error.error });
    throw new Error('Failed to load exercises');
  }
  const exercisesData = exercisesResult.value.exercises;

  return (
    <>
      <img src="/images/background1.svg" alt="decorative" className={styles.vectorBg1} />
      <img src="/images/background2.svg" alt="decorative" className={styles.vectorBg2} />
      <div className={styles.container}>
        <h1 className={styles.title}>AI Workshop Exercises</h1>
        <div className={styles.exerciseGrid}>
          {Object.entries(exercisesData).map(([key, exercise]) => (
            <div key={key} className={styles.exerciseCard}>
              <Link href={`/chat/${key}`} className={styles.exerciseLink}>
                <span className={`${styles.exerciseDifficulty} ${exercise.difficulty === 'easy' ? styles.easy :
                  exercise.difficulty === 'medium' ? styles.medium :
                    exercise.difficulty === 'hard' ? styles.hard : ''
                  }`}>{exercise.difficulty === 'easy' ? 'Beginner' : exercise.difficulty === 'medium' ? 'Advanced' : 'Expert'}</span>
                <img src={exercise.image || '/images/elementor-placeholder-image.png'} alt={`${exercise.title}'s descriptive image`} />
                <div className={styles.exerciseContent}>
                  <h2 className={styles.exerciseTitle}>{exercise.title}</h2>
                  <p className={styles.exerciseDescription}>{exercise.summary}</p>
                </div>
              </Link>
            </div>
          ))}
          <div className={styles.exerciseCard}>
            <Link href={`/prompt-engineering`} className={styles.exerciseLink}>
              <span className={`${styles.exerciseDifficulty} ${styles.hard}`}>Expert</span>
              <img src='/images/covers/05-prompt-engineering.svg' alt={`Dein eigener KI-Assistent's descriptive image`} />
              <div className={styles.exerciseContent}>
                <h2 className={styles.exerciseTitle}>Dein eigener KI-Assistent</h2>
                <p className={styles.exerciseDescription}>{/* TODO */}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
