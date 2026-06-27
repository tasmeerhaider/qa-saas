"use client";

import { useState } from "react";

export default function ConfigureTestsPage() {
  // 1. Target & Repository State
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");

  // 2. Test Configuration State
  const [titleCheck, setTitleCheck] = useState({ enabled: true, expectedTitle: "" });
  const [mobileCheck, setMobileCheck] = useState({ enabled: false, width: 390, height: 844 });
  const [consoleCheck, setConsoleCheck] = useState(false);
  const [networkCheck, setNetworkCheck] = useState(false);

  // 3. UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleRunTests = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("Compiling and injecting tests...");

    // Build the exact payload our API expects
    const payload = {
      repoOwner,
      repoName,
      targetUrl,
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
        setMessage("✅ Pipeline successfully injected! Tests are running on GitHub.");
      } else {
        setMessage("❌ Failed to inject pipeline. Check your console.");
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">QA Test Configurator</h1>
      <p className="text-gray-600 mb-8">Build your automated testing suite without writing code.</p>

      <form onSubmit={handleRunTests} className="space-y-8">
        
        {/* --- SECTION 1: TARGET INFO --- */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Target Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Live Target URL</label>
              <input 
                type="url" 
                required 
                placeholder="https://tasmeerhaider.github.io/portfolio"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Owner</label>
                <input 
                  type="text" 
                  required 
                  placeholder="tasmeerhaider"
                  className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                  value={repoOwner}
                  onChange={(e) => setRepoOwner(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Repository Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="portfolio"
                  className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: TEST MODULES --- */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Select Test Modules</h2>
          
          <div className="space-y-6">
            
            {/* Title Check Module */}
            <div className="border-b pb-4">
              <label className="flex items-center space-x-3 cursor-pointer mb-2">
                <input 
                  type="checkbox" 
                  checked={titleCheck.enabled}
                  onChange={(e) => setTitleCheck({...titleCheck, enabled: e.target.checked})}
                  className="h-5 w-5 text-blue-600 rounded"
                />
                <span className="font-medium text-gray-900">Verify Page Title</span>
              </label>
              {titleCheck.enabled && (
                <div className="ml-8 mt-2">
                  <input 
                    type="text" 
                    placeholder="Expected Title (e.g., My Portfolio)"
                    className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={titleCheck.expectedTitle}
                    onChange={(e) => setTitleCheck({...titleCheck, expectedTitle: e.target.value})}
                  />
                </div>
              )}
            </div>

            {/* Mobile Check Module */}
            <div className="border-b pb-4">
              <label className="flex items-center space-x-3 cursor-pointer mb-2">
                <input 
                  type="checkbox" 
                  checked={mobileCheck.enabled}
                  onChange={(e) => setMobileCheck({...mobileCheck, enabled: e.target.checked})}
                  className="h-5 w-5 text-blue-600 rounded"
                />
                <span className="font-medium text-gray-900">Mobile Responsiveness Check</span>
              </label>
              {mobileCheck.enabled && (
                <div className="ml-8 flex gap-4 mt-2">
                  <div>
                    <label className="text-xs text-gray-500 block">Width (px)</label>
                    <input 
                      type="number" 
                      className="w-24 p-2 border rounded text-sm outline-none"
                      value={mobileCheck.width}
                      onChange={(e) => setMobileCheck({...mobileCheck, width: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block">Height (px)</label>
                    <input 
                      type="number" 
                      className="w-24 p-2 border rounded text-sm outline-none"
                      value={mobileCheck.height}
                      onChange={(e) => setMobileCheck({...mobileCheck, height: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Console Error Scraper */}
            <div className="border-b pb-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={consoleCheck}
                  onChange={(e) => setConsoleCheck(e.target.checked)}
                  className="h-5 w-5 text-blue-600 rounded"
                />
                <div>
                  <span className="font-medium text-gray-900 block">Console Error Scraper</span>
                  <span className="text-sm text-gray-500">Fail test if JavaScript errors are found in the browser console.</span>
                </div>
              </label>
            </div>

            {/* Network/Broken Image Scanner */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={networkCheck}
                  onChange={(e) => setNetworkCheck(e.target.checked)}
                  className="h-5 w-5 text-blue-600 rounded"
                />
                <div>
                  <span className="font-medium text-gray-900 block">Broken Image / Network Scanner</span>
                  <span className="text-sm text-gray-500">Fail test if any 404s or broken assets are detected.</span>
                </div>
              </label>
            </div>

          </div>
        </div>

        {/* --- SUBMIT BUTTON --- */}
        <div className="flex items-center justify-between">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-lg font-bold text-white transition-all ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
          >
            {isSubmitting ? "Compiling..." : "Run Selected Tests"}
          </button>
          
          {message && (
            <span className={`font-medium ${message.includes("✅") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </span>
          )}
        </div>

      </form>
    </div>
  );
}



