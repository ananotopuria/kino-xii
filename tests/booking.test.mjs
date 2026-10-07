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

test('hold validation uses submitted seat indices, keeps messages and leaves ambiguous errors general', () => {
  const submitted = [{ seatId: 12, ticketTypeId: 8 }, { seatId: 11, ticketTypeId: 7 }];
  const result = utils.holdValidationErrors({
    'seats.0.ticketType': ['Child tickets are not permitted.'],
    'seats.1.seatId': ['This seat is invalid.'],
    'seats.1': ['Check this selection.'],
    seats: ['Too many seats.'],
    'seats.7.ticketType': ['Unknown index.'],
    'seats.*.seatId': ['Unspecified seat.'],
  }, submitted, map);
  assert.deepEqual(result, { seatErrors: { 12: ['Child tickets are not permitted.'], 11: ['This seat is invalid.', 'Check this selection.'] },
    general: ['Too many seats.', 'Unknown index.', 'Unspecified seat.'] });
  assert.deepEqual(utils.holdValidationErrors({ 'seats.0.seatId': ['Not in map.'] }, [{ seatId: 99 }], map), {
    seatErrors: {}, general: ['Not in map.'],
  });
});

test('checkout and ticket cards visibly pair each server seat with its ticket type and retain server totals', async () => {
  const { default: Checkout } = await server.ssrLoadModule('/src/components/sessions/Checkout.tsx');
  const { default: TicketCard } = await server.ssrLoadModule('/src/components/profile/TicketCard.tsx');
  const session = { date: '2030-01-01', time: '19:30', hall: { name: 'D' }, venue: { name: 'API Venue' }, format: { name: 'MAX' }, language: { name: 'English' }, movie: { title: 'API Movie', posterUrl: '/poster.png', ageRating: { code: '12+' } } };
  const mixed = [...hold.seats, { seatId: 13, code: 'J3', ticketType: { slug: 'child', name: 'Child' }, price: 7.2 }];
  const checkout = renderToStaticMarkup(React.createElement(Checkout, { session, hold: { ...hold, seats: mixed, subtotal: 777 }, user: null, busy: false, submitting: false, errors: {}, onBack() {}, async onPay() {} }));
  const card = renderToStaticMarkup(React.createElement(TicketCard, { order: { id: 1, reference: 'KX-MIXED', session, totalPrice: 888, tickets: mixed.map(seat => ({ id: seat.seatId, seatCode: seat.code, ticketType: seat.ticketType })), isUpcoming: true, isRefundable: true }, onRefund() {} }));
  for (const html of [checkout, card]) {
    assert.match(html, /Seat J1 — Adult/);
    assert.match(html, /Seat J2 — Student/);
    assert.match(html, /Seat J3 — Child/);
    assert.doesNotMatch(html, /class="sr-only"/);
  }
  assert(checkout.includes('777'));
  assert(card.includes('888') && card.includes('Refund'));
});

function elements(node, predicate) {
  if (!React.isValidElement(node)) return [];
  return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => elements(child, predicate))];
}

test('attempting an extra available seat shows the API limit without changing selection or creating a hold', async () => {
  const { default: Selection } = await server.ssrLoadModule('/src/components/sessions/SeatSelection.tsx');
  const { default: SeatMap } = await server.ssrLoadModule('/src/components/sessions/SeatMap.tsx');
  const { AuthContext } = await server.ssrLoadModule('/src/features/auth/AuthContext.ts');
  const seats = [1, 2, 3, 4].map(id => ({ id, code: `A${id}`, label: `${id}`, state: 'available' }));
  const seatMap = { sections: [{ name: 'Stalls', rows: [{ label: 'A', seats }] }] };
  const options = { maxSeatsPerOrder: 2, ticketTypes: [{ id: 7, slug: 'adult', name: 'Adult', priceRatio: 1, blockedFromRatingAge: null }] };
  const selected = [{ seatId: 1, ticketTypeId: 7 }, { seatId: 2, ticketTypeId: 7 }];
  let changes = 0, holds = 0, renders = 0;
  const html = renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user: { age: 30, profileComplete: true } } }, React.createElement(function Probe() {
    const tree = Selection({ session: { price: 10, movie: { ageRating: { minAge: 0 } } }, map: seatMap, options, selection: selected, disabled: false, creatingHold: false, onChange() { changes++; }, onContinue() { holds++; } });
    const mapElement = elements(tree, node => node.type === SeatMap)[0];
    if (renders++ === 0) mapElement.props.onToggle(seats[2]);
    return tree;
  })));
  assert.equal(changes, 0); assert.equal(holds, 0);
  assert.match(html, /role="alert"[^>]*>You can select up to 2 seats per order/);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 4); // Two selected seats and their Adult buttons.
  assert.match(html, /aria-label="Seat A3, available" aria-pressed="false"(?! disabled)/);
});

test('seat map keeps sold/other-held seats disabled and structural gaps while allowing limit attempts', async () => {
  const { default: SeatMap } = await server.ssrLoadModule('/src/components/sessions/SeatMap.tsx');
  const states = ['available', 'sold', 'held', 'unavailable'];
  const html = renderToStaticMarkup(React.createElement(SeatMap, { map: { sections: [{ name: 'Test', rows: [{ label: 'A', seats: states.map((state, i) => ({ id: i, code: `A${i}`, label: i, state, aisleAfter: true })) }] }] }, selectedIds: new Set(), disabled: false, onToggle() {} }));
  assert.match(html, /Seat A1, sold" aria-pressed="false" disabled/);
  assert.match(html, /Seat A2, held" aria-pressed="false" disabled/);
  assert(!html.includes('Seat A3'));
  assert(html.includes('w-4 shrink-0'));
});

test('seat-specific errors visibly name the seat and prevent continuing until corrected', async () => {
  const { default: Selection } = await server.ssrLoadModule('/src/components/sessions/SeatSelection.tsx');
  const { AuthContext } = await server.ssrLoadModule('/src/features/auth/AuthContext.ts');
  const html = renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user: { age: 30, profileComplete: true } } }, React.createElement(Selection, {
    session: { price: 10, movie: { ageRating: { minAge: 0 } } }, map: { sections: [{ name: 'Test', rows: [{ label: 'J', seats: [{ id: 12, code: 'J2', label: '2', state: 'available' }] }] }] },
    options: { maxSeatsPerOrder: 6, ticketTypes: [{ id: 7, slug: 'adult', name: 'Adult', priceRatio: 1, blockedFromRatingAge: null }] },
    selection: [{ seatId: 12, ticketTypeId: 7 }], disabled: false, creatingHold: false, seatErrors: { 12: ['This seat is invalid.'] }, onChange() {}, onContinue() {},
  })));
  assert.match(html, /Seat J2: This seat is invalid\./);
  assert.match(html, /<button type="button" disabled=""[^>]*>Next: Checkout/);
});

test('limit guard preserves chosen seats and allows removal and reselection with the default Adult type', async () => {
  const { toggleSeat } = await server.ssrLoadModule('/src/utils/seatSelection.ts');
  const selected = [{ seatId: 11, ticketTypeId: 7 }, { seatId: 12, ticketTypeId: 8 }];
  const extra = { id: 13, state: 'available' };
  assert.equal(toggleSeat(selected, extra, 7, 2), selected);
  const removed = toggleSeat(selected, { id: 12, state: 'available' }, 7, 2);
  assert.deepEqual(removed, [selected[0]]);
  assert.deepEqual(toggleSeat(removed, extra, 7, 2), [selected[0], { seatId: 13, ticketTypeId: 7 }]);
});

test('refund Close uses the existing callback and is disabled while refunding', async () => {
  const { default: RefundDialog } = await server.ssrLoadModule('/src/components/profile/RefundDialog.tsx');
  for (const busy of [false, true]) {
    let tree, closes = 0;
    const close = () => { closes++; };
    const html = renderToStaticMarkup(React.createElement(function Probe() {
      tree = RefundDialog({ order: { reference: 'KX-TEST', session: { movie: { title: 'Film' } }, totalPrice: 21, isRefundable: true }, busy, error: '', onClose: close, onConfirm() {} });
      return tree;
    }));
    const button = elements(tree, node => node.props['aria-label'] === 'Close refund dialog')[0];
    assert.equal(button.props.onClick, close);
    assert.equal(button.props.disabled, busy);
    assert(!button.props.className.includes('sr-only'));
    tree.props.onClose();
    assert.equal(closes, busy ? 0 : 1);
    assert(html.includes('Keep tickets') && html.includes(busy ? 'Refunding...' : 'Confirm refund'));
  }
});
