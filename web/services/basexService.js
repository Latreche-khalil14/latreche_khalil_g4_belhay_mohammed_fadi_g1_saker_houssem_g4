const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');

function buildQuery(query, bindings = {}) {
  let prelude = '';
  for (const [key, value] of Object.entries(bindings)) {
    const escaped = String(value).replace(/'/g, "''");
    prelude += `declare variable $${key} := '${escaped}';\n`;
  }
  return prelude + query;
}

function runBasex(query, { isUpdate = false, json = true, bindings = {} } = {}) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(PROJECT_ROOT, `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.xq`);
    const fullQuery = buildQuery(query, bindings);

    fs.writeFile(tempFile, fullQuery, 'utf8', (err) => {
      if (err) return reject(`Failed to write temp XQuery file: ${err.message}`);

      const forbidden = /\b(delete|insert|replace|rename)\b/i;
      if (!isUpdate && forbidden.test(fullQuery)) {
        fs.unlink(tempFile, () => {});
        return reject('Update operations are not allowed in read-only queries.');
      }

      const flags = isUpdate ? '-u' : (json ? '-s method=json' : '');
      const command = `basex ${flags} "${tempFile}"`;

      exec(command, { cwd: PROJECT_ROOT }, (error, stdout, stderr) => {
        fs.unlink(tempFile, () => {});
        if (error) return reject(stderr || stdout || error.message);
        resolve(stdout.trim());
      });
    });
  });
}

function executeQuery(query, isUpdate = false, bindings = {}) {
  return runBasex(query, { isUpdate, json: !isUpdate, bindings }).then((output) => {
    if (isUpdate) return output;
    try {
      return JSON.parse(output);
    } catch (e) {
      throw new Error(`Failed to parse BaseX JSON output: ${e.message}\nRaw: ${output}`);
    }
  });
}

function executeRawQuery(query) {
  const isUpdate = /\b(delete|insert|replace|rename)\b/i.test(query);
  return runBasex(query, { isUpdate, json: false });
}

module.exports = { executeQuery, executeRawQuery };
