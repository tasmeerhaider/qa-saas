"use client";

import { supabase } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const router = useRouter();
    const [repoOwner, setRepoOwner] = useState("");
    const [repoName, setRepoName] = useState("");
    const [isDeploying, setIsDeploying] = useState(false);
    const [testRuns, setTestRuns] = useState<any[]>([]);

    const [githubRepos, setGithubRepos] = useState<any[]>([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(true);

    // 1. Fetch user & their past tests on load
    useEffect(() => {
        const loadData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return router.push("/");

            if (session.provider_token) {
                try {
                    const repoResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
                        headers: {
                            Authorization: `Bearer ${session.provider_token}`,
                            Accept: 'application/vnd.github.v3+json'
                        }
                    });
                    const repos = await repoResponse.json();
                    setGithubRepos(repos);
                } catch (error) {
                    console.error("Failed to fetch repos", error);
                } finally {
                    setIsLoadingRepos(false);
                }
            }

            // Fetch test results from our database table
            const { data } = await supabase
                .from('test_runs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) setTestRuns(data);
        };
        loadData();
    }, [router]);

    // 2. The function that calls our setup API
    const handleSetupRepo = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsDeploying(true);

        try {
            const response = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repoOwner,
                    repoName,
                    // For testing, hardcode your Installation ID from GitHub App settings
                    // In production, you would fetch this from the GitHub API
                    installationId: "142528639"
                }),
            });

            if (response.ok) {
                alert("Success! Playwright code injected into repository.");
                setRepoName("");
            } else {
                alert("Failed to inject code. Check server logs.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
                    <h1 className="text-2xl font-bold text-olive-700">QA Dashboard</h1>
                    <button
                        onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                        className="text-sm text-gray-500 hover:text-black"
                    >
                        Sign Out
                    </button>
                </header>

                {/* Setup Form */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-olive-700">Initialize New Repository</h2>
                    <form onSubmit={handleSetupRepo} className="flex gap-4">

                        {/* NEW: The Dropdown Menu */}
                        <select
                            required
                            disabled={isLoadingRepos}
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-white disabled:bg-gray-50 text-gray-700"
                            onChange={(e) => {
                                // We split the "owner/repo" string back into two pieces when they select one
                                const [owner, name] = e.target.value.split('/');
                                setRepoOwner(owner);
                                setRepoName(name);
                            }}
                        >
                            <option value="" className="text-gray-700">
                                {isLoadingRepos ? "Loading your repositories..." : "Select a repository..."}
                            </option>

                            {/* Map over the repos we fetched and create an option for each one */}
                            {githubRepos.map((repo) => (
                                <option key={repo.id} value={repo.full_name}>
                                    {repo.full_name} {repo.private ? ' 🔒' : ''}
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit" disabled={isDeploying || !repoName}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isDeploying ? 'Injecting...' : 'Inject QA Pipeline'}
                        </button>
                    </form>
                </section>

                {/* Results Table */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-olive-700">Recent Test Executions</h2>
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="p-4 font-medium">Repository</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Duration</th>
                                    <th className="p-4 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {testRuns.length === 0 ? (
                                    <tr><td colSpan={4} className="p-4 text-center text-gray-500">No tests run yet.</td></tr>
                                ) : (
                                    testRuns.map((test, index) => (
                                        <tr key={index} className="border-t border-gray-100">
                                            <td className="p-4 font-medium text-gray-500">{test.repository}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${test.status === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {test.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500">{test.duration || 'N/A'}</td>
                                            <td className="p-4 text-gray-500">{new Date(test.created_at).toLocaleDateString()}</td>
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