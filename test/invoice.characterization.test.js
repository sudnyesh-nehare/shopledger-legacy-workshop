var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('invoice figures match the totals and GST breakdown used to bill the customer', function () {
  var items = [{
    id: 1,
    name: 'Rice',
    hsn: '1006',
    price: 100,
    qty: 1
  }];
  var billed = pricing.computeTotals(items, '');
  var printed = invoice.computeInvoiceFigures({ items: items, coupon: '' });

  assert.deepEqual(
    {
      subtotal: printed.subtotal,
      discount: printed.discount,
      tax: printed.tax,
      cgst: printed.cgst,
      sgst: printed.sgst,
      total: printed.total
    },
    {
      subtotal: billed.subtotal,
      discount: billed.discount,
      tax: billed.tax,
      cgst: billed.cgst,
      sgst: billed.sgst,
      total: billed.total
    }
  );
});

test('invoice uses an HSN slab when the stored line has no gstRate', function () {
  var items = [{
    id: 1,
    name: 'Rice',
    hsn: '1006',
    price: 100,
    qty: 1
  }];
  var billed = pricing.computeTotals(items, '');
  var printed = invoice.computeInvoiceFigures({ items: items, coupon: '' });

  assert.deepEqual(
    {
      subtotal: billed.subtotal,
      tax: billed.tax,
      cgst: billed.cgst,
      sgst: billed.sgst,
      total: billed.total
    },
    { subtotal: 100, tax: 5, cgst: 2.5, sgst: 2.5, total: 105 }
  );
  assert.deepEqual(
    {
      subtotal: printed.subtotal,
      tax: printed.tax,
      cgst: printed.cgst,
      sgst: printed.sgst,
      total: printed.total,
      gstPercent: printed.rows[0].gstPercent
    },
    { subtotal: 100, tax: 5, cgst: 2.5, sgst: 2.5, total: 105, gstPercent: 5 }
  );
});

test('invoice applies the same capped percentage coupon as billing', function () {
  var items = [{
    id: 2,
    name: 'Bulk rice',
    hsn: '1006',
    gstRate: 5,
    price: 2000,
    qty: 1
  }];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var printed = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.deepEqual(
    {
      subtotal: billed.subtotal,
      discount: billed.discount,
      tax: billed.tax,
      cgst: billed.cgst,
      sgst: billed.sgst,
      total: billed.total
    },
    { subtotal: 2000, discount: 150, tax: 92.5, cgst: 46.25, sgst: 46.25, total: 1942.5 }
  );
  assert.deepEqual(
    {
      subtotal: printed.subtotal,
      discount: printed.discount,
      tax: printed.tax,
      cgst: printed.cgst,
      sgst: printed.sgst,
      total: printed.total
    },
    { subtotal: 2000, discount: 150, tax: 92.5, cgst: 46.25, sgst: 46.25, total: 1942.5 }
  );
});

test('invoice rendering omits the reconciliation notice when totals match billing', function () {
  var order = {
    id: 42,
    total: 105,
    coupon: '',
    items: [{
      id: 1,
      name: 'Rice',
      hsn: '1006',
      price: 100,
      qty: 1
    }]
  };

  var html = invoice.render(order);

  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
