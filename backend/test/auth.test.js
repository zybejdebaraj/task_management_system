const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(relativePath, dependencies) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, relativePath), 'utf8'), {
    module, exports: module.exports,
    process: { env: { JWT_SECRET: 'test-only-secret' } },
    require(name) {
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

test('public registration cannot grant an admin role', async () => {
  const calls = [];
  const controller = load('../src/controllers/authController.js', {
    '../config/db': { async query(sql, values) {
      calls.push({ sql, values });
      return { rows: calls.length === 1 ? [] : [{ id: 1, role: values[2] }] };
    } },
    bcrypt: { hash: async () => 'test-hash' },
    jsonwebtoken: {}, crypto: {}, nodemailer: {}, 'google-auth-library': {},
  });
  const res = response();
  await controller.register({ body: { email: 'test@example.invalid', password: 'test-only-password', role: 'admin' } }, res);
  assert.equal(calls[1].values[2], 'member');
  assert.equal(res.body.role, 'member');
});

test('registration rejects missing credentials without touching the database', async () => {
  const controller = load('../src/controllers/authController.js', {
    '../config/db': { query() { throw new Error('Should not query'); } },
    bcrypt: {}, jsonwebtoken: {}, crypto: {}, nodemailer: {}, 'google-auth-library': {},
  });
  const res = response();
  await controller.register({ body: {} }, res);
  assert.equal(res.statusCode, 400);
});

test('a token with an old admin claim uses the current database role', async () => {
  const auth = load('../src/middleware/auth.js', {
    jsonwebtoken: { verify: () => ({ id: 1, role: 'admin' }) },
    '../config/db': { query: async () => ({ rows: [{ role: 'member' }] }) },
  });
  const req = { headers: { authorization: 'Bearer test-token' } };
  let nextCalled = false;
  await auth(req, response(), () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.user.role, 'member');
});

test('deleted users cannot continue using a signed token', async () => {
  const auth = load('../src/middleware/auth.js', {
    jsonwebtoken: { verify: () => ({ id: 1, role: 'admin' }) },
    '../config/db': { query: async () => ({ rows: [] }) },
  });
  const res = response();
  await auth({ headers: { authorization: 'Bearer test-token' } }, res, () => assert.fail('Must not authorize'));
  assert.equal(res.statusCode, 401);
});

test('invalid tokens and missing authorization are rejected', async () => {
  const auth = load('../src/middleware/auth.js', {
    jsonwebtoken: { verify() { throw new Error('Invalid signature'); } },
    '../config/db': { query() { throw new Error('Should not query'); } },
  });
  for (const headers of [{}, { authorization: 'Bearer invalid' }]) {
    const res = response();
    await auth({ headers }, res, () => assert.fail('Must not authorize'));
    assert.equal(res.statusCode, 401);
  }
});

test('updated mailer composes email without contacting an SMTP server', async () => {
  const nodemailer = require('nodemailer');
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const result = await transport.sendMail({
    from: 'sender@example.invalid', to: 'recipient@example.invalid',
    subject: 'Maintenance check', text: 'Offline email check', html: '<p>Offline email check</p>',
  });
  assert.match(result.message.toString(), /Subject: Maintenance check/);
  assert.deepEqual(result.envelope.to, ['recipient@example.invalid']);
});
