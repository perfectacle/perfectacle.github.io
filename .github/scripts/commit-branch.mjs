// Commits the working tree's changes to a branch through the GraphQL API, which GitHub signs on the token's behalf.
// The rulesets reject unsigned commits and a runner has no signing key, so a plain `git push` would be refused.
// The branch is reset to <base-sha> first, so each run replaces the previous attempt instead of stacking on it.
//
// Usage: node commit-branch.mjs <branch> <base-sha> <headline> <body-file>
// Env: GH_TOKEN, GITHUB_REPOSITORY, GITHUB_API_URL, GITHUB_GRAPHQL_URL (all set on Actions runners).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [branch, base, headline, bodyFile] = process.argv.slice(2);
const { GH_TOKEN, GITHUB_REPOSITORY, GITHUB_API_URL, GITHUB_GRAPHQL_URL } = process.env;

const api = async (url, init = {}) => {
  const res = await fetch(url, {
    ...init,
    headers: { authorization: `Bearer ${GH_TOKEN}`, accept: 'application/vnd.github+json', ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.errors) throw new Error(`${url} ${res.status} ${JSON.stringify(body.errors ?? body)}`);
  return body;
};

const refUrl = `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/git/refs`;
const exists = await fetch(`${refUrl}/heads/${branch}`, { headers: { authorization: `Bearer ${GH_TOKEN}` } });
if (exists.ok) {
  await api(`${refUrl}/heads/${branch}`, { method: 'PATCH', body: JSON.stringify({ sha: base, force: true }) });
} else {
  await api(refUrl, { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: base }) });
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean);
const additions = git('diff', '--name-only', '--diff-filter=d').map(path => ({
  path,
  contents: readFileSync(path).toString('base64'),
}));
const deletions = git('diff', '--name-only', '--diff-filter=D').map(path => ({ path }));

const { data } = await api(GITHUB_GRAPHQL_URL, {
  method: 'POST',
  body: JSON.stringify({
    query: `mutation ($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid } } }`,
    variables: {
      input: {
        branch: { repositoryNameWithOwner: GITHUB_REPOSITORY, branchName: branch },
        expectedHeadOid: base,
        message: { headline, body: readFileSync(bodyFile, 'utf8') },
        fileChanges: { additions, deletions },
      },
    },
  }),
});
console.log(`${branch} → ${data.createCommitOnBranch.commit.oid}`);
