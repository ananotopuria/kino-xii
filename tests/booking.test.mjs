import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

let server;
let utils;
let api;
let client;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  utils = await server.ssrLoadModule('/src/utils/booking.ts');
  api = await server.ssrLoadModule('/src/api/booking.ts');
  client = (await server.ssrLoadModule('/src/api/client.ts')).apiClient;
  globalThis.localStorage = { getItem: () => null };
});
after(async () => { await server?.close(); delete globalThis.localStorage; });

const hold = {
  holdId: '00000000-0000-4000-8000-000000000001', sessionId: 42,
  expiresAt: '2030-01-01T12:08:00Z', secondsRemaining: 480, isLive: true,
  subtotal: 21, seats: [
    { seatId: 11, code: 'J1', ticketType: { slug: 'adult', name: 'Adult' }, price: 12 },
    { seatId: 12, code: 'J2', ticketType: { slug: 'student', name: 'Student' }, price: 9 },
  ],
};
const ticketTypes = [{ id: 7, slug: 'adult' }, { id: 8, slug: 'student' }];
const map = { sessionId: 42, sections: [{ name: 'Circle', rows: [{ label: 'J', seats: [
  { id: 11, code: 'J1' }, { id: 12, code: 'J2' },
] }] }] };

test('countdown uses the absolute deadline after background time, and treats 200 isLive:false as expired', () => {
  assert.equal(utils.remainingSeconds(hold, Date.parse('2030-01-01T12:06:30Z')), 90);
  assert.equal(utils.remainingSeconds({ ...hold, secondsRemaining: 999 }, Date.parse('2030-01-01T12:06:30Z')), 90);
  assert.equal(utils.remainingSeconds(hold, Date.parse('2030-01-01T12:08:01Z')), 0);
  assert.equal(utils.remainingSeconds({ ...hold, isLive: false }, Date.parse('2030-01-01T12:00:00Z')), 0);
  assert.equal(utils.remainingSeconds({ ...hold, expiresAt: 'invalid' }), 0);
});

test('restores ticket types by API slug, drops only contested codes, and scopes persistence by account/session', () => {
  const selection = utils.holdSelection(hold, ticketTypes);
  assert.deepEqual(selection, [{ seatId: 11, ticketTypeId: 7 }, { seatId: 12, ticketTypeId: 8 }]);
  assert.deepEqual(utils.dropContested(selection, map, ['J2']), [selection[0]]);
  assert.deepEqual(utils.dropContested(selection, map, []), selection);
  assert.notEqual(utils.bookingStorageKey(42, 1), utils.bookingStorageKey(42, 2));
  assert.notEqual(utils.bookingStorageKey(42, 1), utils.bookingStorageKey(43, 1));
});

test('booking API sends exact hold/read/release/order contracts; a replacement does not issue a DELETE', async () => {
  const calls = [];
  client.defaults.adapter = async config => {
    calls.push({ method: config.method, url: config.url, body: config.data ? JSON.parse(config.data) : undefined });
    return { data: { data: config.url === '/orders' ? { reference: 'KX-TEST' } : hold }, status: config.method === 'delete' ? 204 : 201, statusText: 'OK', headers: {}, config };
  };
  const seats = { seats: [{ seatId: 11, ticketType: 'adult' }] };
  assert.equal((await api.createHold(42, seats)).holdId, hold.holdId);
  await api.createHold(42, seats);
  assert.deepEqual(calls.map(call => call.method), ['post', 'post']);
  assert.deepEqual(calls[0], { method: 'post', url: '/sessions/42/holds', body: seats });
  await api.getHold(hold.holdId);
  await api.releaseHold(hold.holdId);
  assert.equal(calls[2].url, `/holds/${hold.holdId}`);
  assert.equal(calls[3].method, 'delete');
  const request = { holdId: hold.holdId, fullName: 'Test Person', email: 'test@example.test', mobileNumber: '555123456', cardNumber: '4242 4242 4242 4242', expiry: '09/30', cvv: '123' };
  assert.equal((await api.createOrder(request)).reference, 'KX-TEST');
  assert.deepEqual(calls[4].body, request);
});

test('preserves backend status, field validation, and contested codes without exposing request/card data', () => {
  for (const status of [401, 403, 409, 422]) {
    const data = { message: 'Backend message', errors: { cvv: ['Backend CVV error'] }, contested: ['J2'] };
    const result = utils.bookingError({ isAxiosError: true, response: { status, data }, config: { data: 'sensitive' } });
    assert.deepEqual(result, { ...data, status });
    assert(!JSON.stringify(result).includes('sensitive'));
  }
});

test('confirmation renders exclusively from the order response; checkout renders held seats and API subtotal', async () => {
  const { default: Confirmation } = await server.ssrLoadModule('/src/components/sessions/BookingConfirmation.tsx');
  const { default: Checkout } = await server.ssrLoadModule('/src/components/sessions/Checkout.tsx');
  const session = { id: 42, date: '2030-01-01', time: '19:30', hall: { name: 'D' }, venue: { name: 'API Venue' }, movie: { title: 'API Movie', posterUrl: '/poster.png' } };
  const order = { reference: 'KX-REAL-RESPONSE', session, totalPrice: 123.45, tickets: [ { seatCode: 'Z9', ticketType: { slug: 'adult', name: 'Adult' }, price: 123.45 } ] };
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Confirmation, { order })));
  assert(html.includes('KX-REAL-RESPONSE') && html.includes('API Movie') && html.includes('Z9') && html.includes('123.45'));
  assert(!html.includes('J1'));
  const checkout = renderToStaticMarkup(React.createElement(Checkout, { session, hold, user: { fullName: 'From Profile', email: 'profile@example.test', mobileNumber: '555123456' }, busy: false, submitting: false, errors: {}, onBack() {}, async onPay() {} }));
  assert(checkout.includes('J1, J2') && checkout.includes('21'));
  assert(checkout.includes('checkout-fullName') && checkout.includes('checkout-mobileNumber'));
  assert(checkout.toLowerCase().includes('autocomplete="off"'));
});
