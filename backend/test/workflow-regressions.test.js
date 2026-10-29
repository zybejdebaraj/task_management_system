const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(file, dependencies) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    module, exports: module.exports, process: { env: {} },
    require: (name) => {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return module.exports;
}
function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; } };
}

test('task access belongs to its project owner and assigned member', async () => {
  const task = { id: 5, project_owner_id: 10, user_id: 20 };
  const access = load('utils/taskAccess.js', { '../config/db': { query: async () => ({ rows: [task] }) } });
  assert.equal(await access(5, { id: 10, role: 'admin' }), task);
  assert.equal(await access(5, { id: 20, role: 'member' }), task);
  assert.equal(await access(5, { id: 30, role: 'admin' }), false);
  assert.equal(await access(5, { id: 30, role: 'member' }), false);
});

test('comment access is denied before reading task comments', async () => {
  const controller = load('controllers/commentController.js', {
    '../config/db': { query() { assert.fail('Unauthorized comment data must not be read'); } },
    '../utils/taskAccess': async () => false,
  });
  const res = response();
  await controller.getComments({ params: { taskId: 5 }, user: { id: 30 } }, res);
  assert.equal(res.statusCode, 403);
});

function taskController(queries) {
  const existing = { title: 'Test', description: null, status: 'todo', user_id: 20, project_id: 3,
    project_owner_id: 10, labels: ['qa'], due_date: null, priority: 'high', is_big: false };
  return load('controllers/taskController.js', {
    '../config/db': { async query(sql, values) {
      queries.push({ sql, values });
      if (sql.includes('SELECT t.title')) return { rows: [existing] };
      if (sql.includes('FROM project_members')) return { rows: [{}] };
      return { rows: [{}] };
    } }, nodemailer: {},
  });
}

test('status updates preserve stored labels', async () => {
  const queries = [];
  const controller = taskController(queries);
  await controller.updateTask({ params: { id: 5 }, body: { status: 'in-progress' }, user: { id: 20, role: 'member' } }, response());
  const update = queries.find((query) => query.sql.includes('UPDATE tasks'));
  assert.equal(update.values[9], '["qa"]');
});

test('members cannot change labels or bypass field restrictions with empty values', async () => {
  for (const body of [{ labels: [] }, { description: null }, { title: '' }]) {
    const queries = [], res = response();
    await taskController(queries).updateTask({ params: { id: 5 }, body, user: { id: 20, role: 'member' } }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(queries.some((query) => query.sql.includes('UPDATE tasks')), false);
  }
});

test('invalid statuses are rejected before a database update', async () => {
  const queries = [], res = response();
  await taskController(queries).updateTask({ params: { id: 5 }, body: { status: 'invalid' }, user: { id: 20, role: 'member' } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(queries.some((query) => query.sql.includes('UPDATE tasks')), false);
});
