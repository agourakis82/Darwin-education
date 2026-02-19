import process from 'node:process';

type RouteCheck = {
  path: string;
  class: 'page' | 'api';
  allow401?: boolean;
};

const checks: RouteCheck[] = [
  { path: '/', class: 'page' },
  { path: '/conteudo', class: 'page' },
  { path: '/conteudo/doencas', class: 'page' },
  { path: '/conteudo/medicamentos', class: 'page' },
  { path: '/simulado', class: 'page' },
  { path: '/flashcards', class: 'page' },
  { path: '/trilhas', class: 'page' },
  { path: '/login', class: 'page' },
  { path: '/api/ddl/questions', class: 'api', allow401: true },
  { path: '/api/flashcards/due', class: 'api', allow401: true },
  { path: '/api/qgen/stats', class: 'api', allow401: true },
  { path: '/api/theory-gen/stats', class: 'api', allow401: true },
  { path: '/api/ai/stats', class: 'api', allow401: true },
];

const args = process.argv.slice(2).reduce<Record<string, string>>((acc, arg) => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  if (key) {
    acc[key] = value ?? 'true';
  }
  return acc;
}, {});

const baseUrl =
  args.base ??
  process.env.DEPLOY_BASE_URL ??
  process.env.PREVIEW_URL ??
  process.env.VERCEL_URL ??
  process.env.DEPLOYMENT_URL ??
  'http://localhost:3000';

const stripSlash = (value: string) => value.replace(/\/$/, '');

const isRouteOk = (status: number, check: RouteCheck): boolean => {
  if (check.class === 'page') {
    return status >= 200 && status < 400;
  }

  if (status === 401 || status === 403) {
    return Boolean(check.allow401);
  }

  return status >= 200 && status < 500;
};

const main = async () => {
  const normalizedBase = stripSlash(baseUrl);
  console.log(`\nRunning deploy smoke against: ${normalizedBase}\n`);

  const failures: { path: string; status: number; message: string }[] = [];

  for (const check of checks) {
    const url = `${normalizedBase}${check.path}`;
    try {
      const response = await fetch(url, { redirect: 'follow' });
      const ok = isRouteOk(response.status, check);
      if (ok) {
        console.log(`✅ ${check.path} -> ${response.status}`);
      } else {
        const status = response.status;
        const message = `❌ ${check.path} -> ${status}`;
        console.error(message);
        failures.push({ path: check.path, status, message });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown fetch error';
      const status = 0;
      const failure = `❌ ${check.path} -> network error: ${message}`;
      console.error(failure);
      failures.push({ path: check.path, status, message });
    }
  }

  if (failures.length > 0) {
    console.error(
      `\nSmoke test failed with ${failures.length} failing route(s):`,
    );
    for (const failure of failures) {
      console.error(` - ${failure.path} (${failure.status || 'network'})`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('\n✅ Deploy smoke passed.');
};

void main();
