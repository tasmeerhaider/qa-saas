import { NextResponse } from 'next/server';
import { App } from 'octokit';

const githubApp = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
});

// Helper function to check if a file exists and get its SHA
async function getFileSha(octokit: any, owner: string, repo: string, path: string) {
  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
    });
    return data.sha;
  } catch (error: any) {
    if (error.status === 404) return undefined; // File doesn't exist, which is fine
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { repoOwner, repoName, installationId } = await request.json();
    const octokit = await githubApp.getInstallationOctokit(installationId);

    const testFileContent = `
import { test, expect } from '@playwright/test';

test('Critical Flow Check', async ({ page }) => {
  // We use an absolute URL so GitHub's cloud runner knows exactly where to go
  await page.goto('https://tasmeerhaider.github.io/portfolio/');
  await expect(page).toHaveTitle(/My awesome portfolio/);
});
    `;

    const yamlContent = `
name: QA SaaS Runner
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm init -y
      - run: npm install @playwright/test
      - run: npx playwright install --with-deps chromium
      
      # 1. Start the stopwatch and save it to GitHub's temporary environment
      - name: Record Start Time
        run: echo "START_TIME=$(date +%s)" >> $GITHUB_ENV
      
      # 2. Run the actual test
      - run: npx playwright test
        
# 3. If it passes, stop the watch, calculate the difference, and send it
      - name: Report Success
        if: success()
        run: |
          END_TIME=$(date +%s)
          DURATION=$((END_TIME - START_TIME))s
          curl -X POST -H "Content-Type: application/json" -d '{"repo":"${repoOwner}/${repoName}", "status":"passed", "executionTime":"'$DURATION'", "logUrl":"https://github.com/\${{ github.repository }}/actions/runs/\${{ github.run_id }}"}' https://till-unpledged-half.ngrok-free.dev/api/webhook

      # 4. If it fails, stop the watch, calculate the difference, and send it
      - name: Report Failure
        if: failure()
        run: |
          END_TIME=$(date +%s)
          DURATION=$((END_TIME - START_TIME))s
          curl -X POST -H "Content-Type: application/json" -d '{"repo":"${repoOwner}/${repoName}", "status":"failed", "executionTime":"'$DURATION'", "logUrl":"https://github.com/\${{ github.repository }}/actions/runs/\${{ github.run_id }}"}' https://till-unpledged-half.ngrok-free.dev/api/webhook
    `;

    // 1. Get SHAs if the files already exist
    const testSha = await getFileSha(octokit, repoOwner, repoName, 'tests/saas.spec.ts');
    const yamlSha = await getFileSha(octokit, repoOwner, repoName, '.github/workflows/qa-saas.yml');

    // 2. Push the Playwright file (Include SHA if it exists)
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: repoOwner,
      repo: repoName,
      path: 'tests/saas.spec.ts',
      message: 'Setup QA SaaS Testing',
      content: Buffer.from(testFileContent).toString('base64'),
      ...(testSha && { sha: testSha }),
    });

    // 3. Push the YAML file (Include SHA if it exists)
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: repoOwner,
      repo: repoName,
      path: '.github/workflows/qa-saas.yml',
      message: 'Setup QA SaaS Pipeline',
      content: Buffer.from(yamlContent).toString('base64'),
      ...(yamlSha && { sha: yamlSha }),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Failed to setup repository:", error);
    return NextResponse.json({ success: false, error: "Failed to setup repo" }, { status: 500 });
  }
}