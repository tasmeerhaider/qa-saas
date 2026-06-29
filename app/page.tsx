"use client";

import { supabase } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css"; // <-- Import the CSS Module

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Check if the user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { 
        scopes: "repo workflow",
        redirectTo: `${window.location.origin}/dashboard`
      },
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <main className={styles.mainContainer}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>QA Automator</h1>
        <p className={styles.subtitle}>Zero-config Playwright testing for your GitHub repos.</p>
        <button className={styles.loginBtn} onClick={handleLogin}>
          Sign in with GitHub
        </button>
      </div> 
    </main>
  );
}