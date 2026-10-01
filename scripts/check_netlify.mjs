import { execSync } from 'child_process';

try {
  const output = execSync('npx --yes netlify api listSiteDeploys --data "{\\"site_id\\": \\"60a3b040-c370-4b98-b776-18cd5da6c22c\\"}"', {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const deploys = JSON.parse(output);
  console.log('Total deploys found:', deploys.length);
  if (deploys.length > 0) {
    console.log('Ultimo deploy:', {
      id: deploys[0].id,
      state: deploys[0].state,
      created_at: deploys[0].created_at,
      name: deploys[0].name,
      context: deploys[0].context,
      deploy_url: deploys[0].deploy_url,
    });
  }
} catch (e) {
  console.error('Error running netlify api:', e.stderr?.toString() || e.stdout?.toString() || e.message);
}
