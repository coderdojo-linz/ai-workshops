'use client';

import React from 'react';

import styles from './LogoutButton.module.css';

interface LogoutButtonProps extends React.ButtonHTMLAttributes<HTMLDivElement> { }

export default function LogoutButton(props: LogoutButtonProps) {
    let [username, setUsername] = React.useState<string | null>(null);

    React.useEffect(() => {
        // Fetch /auth/me to get the username
        fetch('/api/auth/me')
            .then((response) => response.json())
            .then((data) => {
                setUsername(data.workshopName || 'User');
            })
            .catch((error) => {
                console.error('Error fetching auth status:', error);
                setUsername(null);
            });
    }, []);

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
        <div className={styles.logoutContainer} {...props}>
            {username && <span className={styles.username}>{username}</span>}
            <button className={styles.logoutButton} onClick={handleLogout}>Log Out</button>
        </div>
    );
}
