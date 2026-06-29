import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { repoOwner, repoName, targetUrl, checks, providerToken } = body;

    if (!providerToken) {
      return NextResponse.json({ error: "Unauthorized. Missing GitHub OAuth Token." }, { status: 401 });
    }

    if (!repoOwner || !repoName || !targetUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. BUILD THE PLAYWRIGHT SCRIPT
    let dynamicPlaywrightCode = "import { test, expect } from '@playwright/test';\n\n";
    dynamicPlaywrightCode += "test('Dynamic QA Automated Scan', async ({ page }) => {\n";

    if (checks.consoleErrorCheck?.enabled) {
      dynamicPlaywrightCode += "  // Catch any JavaScript console errors\n";
      dynamicPlaywrightCode += "  page.on('pageerror', exception => { throw new Error(`Console Error Found: ${exception}`); });\n\n";
    }

    if (checks.brokenImageCheck?.enabled) {
      dynamicPlaywrightCode += "  // Catch broken assets (404s, 500s)\n";
      dynamicPlaywrightCode += "  page.on('response', res => { \n";
      dynamicPlaywrightCode += "    if(res.status() >= 400) throw new Error(`Network Error: ${res.url()} failed with status ${res.status()}`);\n";
      dynamicPlaywrightCode += "  });\n\n";
    }

    if (checks.mobileCheck?.enabled) {
      dynamicPlaywrightCode += `  // Emulate mobile device screen\n`;
      dynamicPlaywrightCode += `  await page.setViewportSize({ width: ${checks.mobileCheck.width}, height: ${checks.mobileCheck.height} });\n\n`;
    }

    dynamicPlaywrightCode += `  await page.goto('${targetUrl}');\n\n`;

    if (checks.titleCheck?.enabled && checks.titleCheck.expectedTitle) {
      dynamicPlaywrightCode += `  // Verify the exact page title\n`;
      dynamicPlaywrightCode += `  await expect(page).toHaveTitle('${checks.titleCheck.expectedTitle}');\n`;
    }

    dynamicPlaywrightCode += "});\n";

    // 2. BUILD THE YAML FILE (Using an Array to bypass JavaScript template errors)
    const yamlContent = [
      "name: QA SaaS Runner",
      "on: [push, pull_request]",
      "jobs:",
      "  test:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - uses: actions/setup-node@v4",
      "      - run: npm init -y",
      "      - run: npm install @playwright/test",
      "      - run: npx playwright install --with-deps chromium",
      "      ",
      "      - name: Record Start Time",
      "        run: echo \"START_TIME=$(date +%s)\" >> $GITHUB_ENV",
      "      ",
      "      - run: npx playwright test tests/saas.spec.ts",
      "        ",
      "      - name: Report Success",
      "        if: success()",
      "        run: |",
      "          END_TIME=$(date +%s)",
      "          DURATION=$((END_TIME - START_TIME))s",
      "          curl -X POST -H \"Content-Type: application/json\" -d '{\"repo\":\"" + repoOwner + "/" + repoName + "\", \"status\":\"passed\", \"executionTime\":\"'$DURATION'\", \"logUrl\":\"https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}\"}' https://till-unpledged-half.ngrok-free.dev/api/webhook",
      "",
      "      - name: Report Failure",
      "        if: failure()",
      "        run: |",
      "          END_TIME=$(date +%s)",
      "          DURATION=$((END_TIME - START_TIME))s",
      "          curl -X POST -H \"Content-Type: application/json\" -d '{\"repo\":\"" + repoOwner + "/" + repoName + "\", \"status\":\"failed\", \"executionTime\":\"'$DURATION'\", \"logUrl\":\"https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}\"}' https://till-unpledged-half.ngrok-free.dev/api/webhook"
    ].join("\n");

    // 3. PUSH TO GITHUB (Using safe string concatenation!)
    const pushToGitHub = async (path: string, content: string) => {
      const token = providerToken;

      // Using bulletproof double quotes and '+' to prevent parsing errors
      const url = "https://api.github.com/repos/" + repoOwner + "/" + repoName + "/contents/" + path;

      let sha = "";
      const checkRes = await fetch(url, {
        headers: { Authorization: "Bearer " + token }
      });

      if (checkRes.ok) {
        const fileData = await checkRes.json();
        sha = fileData.sha;
      }

      const base64Content = Buffer.from(content).toString("base64");

      const bodyData: any = {
        message: "Automated QA Code Injection",
        content: base64Content,
      };
      if (sha) bodyData.sha = sha;

      const pushRes = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      // --- NEW DEBUGGER LOGIC ---
      if (!pushRes.ok) {
        const errorDetails = await pushRes.text();
        console.error(`🚨 GITHUB REJECTION ON ${path}:`, errorDetails);
        throw new Error("GitHub API failed for " + path);
      }
    };

    // 4. EXECUTE UPLOADS
    await pushToGitHub(".github/workflows/qa-saas.yml", yamlContent);
    await pushToGitHub("tests/saas.spec.ts", dynamicPlaywrightCode);

    return NextResponse.json({ success: true, message: "Pipeline injected successfully!" });

  } catch (error) {
    console.error("Setup API Error:", error);
    return NextResponse.json({ error: "Failed to set up pipeline" }, { status: 500 });
  }
}