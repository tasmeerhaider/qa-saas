"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import styles from "./configure.module.css"; // <-- Importing the CSS Module

export default function ConfigureTestsPage() {
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");

  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(true);

  const [titleCheck, setTitleCheck] = useState({ enabled: true, expectedTitle: "" });
  const [mobileCheck, setMobileCheck] = useState({ enabled: false, width: 390, height: 844 });
  const [consoleCheck, setConsoleCheck] = useState(false);
  const [networkCheck, setNetworkCheck] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [providerToken, setProviderToken] = useState("");

  useEffect(() => {
    // Note: If you used Option 1 for the document.title, keep it here!

    const loadRepos = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.provider_token) {
        try {
          setProviderToken(session.provider_token);
          const repoResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
              Accept: 'application/vnd.github.v3+json'
            }
          });
          const repos = await repoResponse.json();
          if (Array.isArray(repos)) {
            setGithubRepos(repos);
          }
        } catch (error) {
          console.error("Failed to fetch repos", error);
        } finally {
          setIsLoadingRepos(false);
        }
      } else {
        setIsLoadingRepos(false);
      }
    };

    loadRepos();
  }, []);

  const handleRunTests = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("Compiling and injecting tests...");

    const payload = {
      repoOwner,
      repoName,
      targetUrl,
      providerToken,
      checks: {
        titleCheck,
        mobileCheck,
        consoleErrorCheck: { enabled: consoleCheck },
        brokenImageCheck: { enabled: networkCheck }
      }
    };

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage("Pipeline successfully injected! Tests are running on GitHub.");
      } else {
        setMessage("Failed to inject pipeline. Check your console.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.configWrapper}>

      <Link href="/dashboard" className={styles.backLink}>
        Back to Dashboard
      </Link>

      <h1 className={styles.pageTitle}>QA Test Configurator</h1>
      <p className={styles.pageDesc}>Build your automated testing suite without writing code.</p>

      <form onSubmit={handleRunTests}>

        {/* --- SECTION 1: TARGET INFO --- */}
        <div className={styles.formSection}>
          <h2>Target Information</h2>
          <div>
            <div className={styles.inputGroup}>
              <label>Select GitHub Repository</label>
              <select
                required
                disabled={isLoadingRepos}
                className={styles.selectField}
                onChange={(e) => {
                  const [owner, name] = e.target.value.split('/');
                  setRepoOwner(owner);
                  setRepoName(name);
                }}
              >
                <option value="">
                  {isLoadingRepos ? "Loading your repositories..." : "Choose a repository..."}
                </option>
                {githubRepos.map((repo) => (
                  <option key={repo.id} value={repo.full_name}>
                    {repo.full_name} {repo.private ? ' 🔒' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Live Target URL</label>
              <input
                type="url"
                required
                placeholder="https://tasmeerhaider.github.io/portfolio"
                className={styles.inputField}
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* --- SECTION 2: TEST MODULES --- */}
        <div className={styles.formSection}>
          <h2>Select Test Modules</h2>

          <div>

            {/* Title Check Module */}
            <div className={styles.checkboxRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={titleCheck.enabled}
                  onChange={(e) => setTitleCheck({ ...titleCheck, enabled: e.target.checked })}
                />
                <span className={styles.checkboxTitle}>Verify Page Title</span>
              </label>
              {titleCheck.enabled && (
                <div className={styles.nestedInputs}>
                  <input
                    type="text"
                    placeholder="Expected Title (e.g., My Portfolio)"
                    className={styles.inputField}
                    value={titleCheck.expectedTitle}
                    onChange={(e) => setTitleCheck({ ...titleCheck, expectedTitle: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Mobile Check Module */}
            <div className={styles.checkboxRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={mobileCheck.enabled}
                  onChange={(e) => setMobileCheck({ ...mobileCheck, enabled: e.target.checked })}
                />
                <span className={styles.checkboxTitle}>Mobile Responsiveness Check</span>
              </label>
              {mobileCheck.enabled && (
                <div className={styles.nestedInputs}>
                  <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                    <label>Width (px)</label>
                    <input
                      type="number"
                      className={styles.inputField}
                      value={mobileCheck.width}
                      onChange={(e) => setMobileCheck({ ...mobileCheck, width: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                    <label>Height (px)</label>
                    <input
                      type="number"
                      className={styles.inputField}
                      value={mobileCheck.height}
                      onChange={(e) => setMobileCheck({ ...mobileCheck, height: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Console Error Scraper */}
            <div className={styles.checkboxRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={consoleCheck}
                  onChange={(e) => setConsoleCheck(e.target.checked)}
                />
                <div className={styles.checkboxText}>
                  <span className={styles.checkboxTitle}>Console Error Scraper</span>
                  <span className={styles.checkboxDesc}>Fail test if JavaScript errors are found in the browser console.</span>
                </div>
              </label>
            </div>

            {/* Network/Broken Image Scanner */}
            <div className={styles.checkboxRow} style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={networkCheck}
                  onChange={(e) => setNetworkCheck(e.target.checked)}
                />
                <div className={styles.checkboxText}>
                  <span className={styles.checkboxTitle}>Broken Image / Network Scanner</span>
                  <span className={styles.checkboxDesc}>Fail test if any 404s or broken assets are detected.</span>
                </div>
              </label>
            </div>

          </div>
        </div>

        {/* --- SUBMIT BUTTON --- */}
        <div className={styles.submitWrapper}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting || !repoName}
          >
            {isSubmitting ? "Compiling..." : "Run Selected Tests"}
          </button>

          {message && (
            <span className={styles.statusMessage} style={{ color: message.includes("Pipeline") ? "#15803d" : "#b91c1c" }}>
              {message}
            </span>
          )}
        </div>
      </form>

    </div>
  );
}