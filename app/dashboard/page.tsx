"use client";

import { supabase } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./dashboard.module.css";

export default function Dashboard() {
    const router = useRouter();
    const [testRuns, setTestRuns] = useState<any[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchTestRuns = async () => {
        setIsRefreshing(true);
        try {
            const { data, error } = await supabase
                .from('test_runs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) setTestRuns(data);
            if (error) console.error("Error fetching tests:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return router.push("/");

            fetchTestRuns();
        };

        loadData();
    }, [router]);

    return (
        <div className={styles.dashboardWrapper}>
            <div className={styles.dashboardContainer}>

                {/* Header */}
                <header className={styles.header}>
                    <h1>QA Dashboard</h1>
                    <button
                        className={styles.signOutBtn}
                        onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                    >
                        Sign Out
                    </button>
                </header>

                {/* The Router Card */}
                <section className={`${styles.card} ${styles.routerCard}`}>
                    <div>
                        <h2>Initialize New Test Run</h2>
                        <p>Configure your target URL and select QA modules before injecting.</p>
                    </div>
                    <Link href="/dashboard/configure" className={styles.primaryLink}>
                        Open Configurator
                    </Link>
                </section>

                {/* Results Table */}
                <section className={styles.card}>
                    <div className={styles.tableHeader}>
                        <h2>Recent Test Executions</h2>
                        <button
                            className={styles.refreshBtn}
                            onClick={fetchTestRuns}
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? (
                                <>
                                    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
                                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75"></path>
                                    </svg>
                                    Refreshing...
                                </>
                            ) : (
                                "Refresh Data"
                            )}
                        </button>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Repository</th>
                                    <th>Status</th>
                                    <th>Duration</th>
                                    <th>Date</th>
                                    <th>Logs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {testRuns.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#6b7280' }}>No tests run yet.</td></tr>
                                ) : (
                                    testRuns.map((test, index) => (
                                        <tr key={index}>
                                            <td style={{ fontWeight: 500 }}>{test.repository}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${test.status === 'passed' ? styles.statusPassed : styles.statusFailed}`}>
                                                    {test.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>{test.duration || 'N/A'}</td>
                                            <td>{new Date(test.created_at).toLocaleDateString()}</td>
                                            <td>
                                                {test.log_url ? (
                                                    <a href={test.log_url} target="_blank" rel="noreferrer" className={styles.logLink}>
                                                        View Output
                                                    </a>
                                                ) : (
                                                    <span style={{ color: '#9ca3af' }}>N/A</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

            </div>
        </div>
    );
}