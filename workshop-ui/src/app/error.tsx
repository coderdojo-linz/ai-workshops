'use client';

import styles from './error.module.css';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: Readonly<ErrorProps>) {
  return (
    <div className={styles.errorContainer}>
      <h2 className={styles.errorTitle}>Etwas ist schiefgelaufen</h2>
      <p className={styles.errorMessage}>{process.env.NODE_ENV === 'development' ? error.message : 'Bitte versuche es erneut.'}</p>
      <button onClick={() => reset()} className={styles.errorButton}>Wiederholen</button>
    </div>
  );
}
