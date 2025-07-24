import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { validateExercisesFile, type ExercisesFile } from '@/lib/exercise-schema';
import styles from './page.module.css';

export default function Home() {
  // Read exercises.json from the prompts directory
  const exercisesPath = path.join(process.cwd(), 'prompts', 'exercises.json');
  const exercisesContent = fs.readFileSync(exercisesPath, 'utf8');
  const exercisesData: ExercisesFile = validateExercisesFile(JSON.parse(exercisesContent));

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
