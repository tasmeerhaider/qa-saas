"use client";

import { supabase } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function home () {
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
        redirectTo: `${window.location.origin}/dashboard`,
        scopes: "repo"
      },
    });
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (<main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-2">QA Automator</h1>
        <p className="text-gray-500 mb-8">Zero-config Playwright testing for your GitHub repos.</p>
        <button 
          onClick={handleLogin}
          className="w-full bg-black text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 transition-colors"
        >
          Sign in with GitHub
        </button>
      </div>
    </main>
  );
}