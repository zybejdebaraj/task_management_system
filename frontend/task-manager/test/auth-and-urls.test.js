import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getUser, isAuthenticated, isAdmin } from '../src/utils/auth.js';
import { resolveBackendUrl, uploadUrl } from '../src/api/config.js';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
beforeEach(() => storage.clear());

function token(payload) {
  return `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.test-signature`;
}

test('valid user tokens remain available to navigation', () => {
  localStorage.setItem('token', token({ id: 1, role: 'admin', exp: Date.now() / 1000 + 3600 }));
  assert.equal(getUser().id, 1);
  assert.equal(isAuthenticated(), true);
  assert.equal(isAdmin(), true);
});

test('malformed tokens cannot crash navigation', () => {
  localStorage.setItem('token', 'not-a-token');
  assert.equal(getUser(), null);
  assert.equal(localStorage.getItem('token'), null);
});

test('expired or invalid-expiry tokens are cleared', () => {
  for (const payload of [{ exp: Date.now() / 1000 - 60 }, {}, { exp: 'invalid' }, null, []]) {
    localStorage.setItem('token', token(payload));
    assert.equal(isAuthenticated(), false);
    assert.equal(localStorage.getItem('token'), null);
  }
});

test('signed-out visitors have no admin access', () => {
  assert.equal(getUser(), null);
  assert.equal(isAdmin(), false);
});

test('backend configuration handles blank values and trailing slashes', () => {
  assert.equal(resolveBackendUrl(undefined, true), 'http://localhost:5000');
  assert.equal(resolveBackendUrl(undefined, false), '');
  assert.equal(resolveBackendUrl(' https://api.example.invalid/// '), 'https://api.example.invalid');
});

test('attachments and avatars use the configured server', () => {
  assert.equal(uploadUrl('/uploads/file.png', 'https://api.example.invalid'), 'https://api.example.invalid/uploads/file.png');
  assert.equal(uploadUrl('uploads/file.png', ''), '/uploads/file.png');
  assert.equal(uploadUrl('https://cdn.example.invalid/image.png', 'https://api.example.invalid'), 'https://cdn.example.invalid/image.png');
  assert.equal(uploadUrl(null), null);
});
