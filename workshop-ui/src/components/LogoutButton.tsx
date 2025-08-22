'use client';

import styles from './LogoutButton.module.css';

interface LogoutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export default function LogoutButton(props: LogoutButtonProps) {

    function handleLogout(): void {
        // Call the logout API and refresh the page
        fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'logout' }),
        })
            .then(() => {
                window.location.reload();
            })
            .catch((error) => {
                console.error('Logout failed:', error);
            });
    }

    return (
        <button className={styles.logoutButton} onClick={handleLogout} {...props}>Log Out</button>
    );
}
