// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let company;
let invoice;

beforeEach(async function () {
  let companyResult = await db.query(`
    INSERT INTO companies
    VALUES ('apple', 'Apple', 'Take a bite out of a computer'),
      ('ibm', 'IBM', 'Big blue.')
    RETURNING code, name, description
  `);
  company = companyResult.rows[0];

  let invoiceResults = await db.query(`
    INSERT INTO invoices (comp_Code, amt, paid, paid_date)
    VALUES ('apple', 100, false, null),
      ('apple', 200, false, null),
      ('apple', 300, true, '2018-01-01'),
      ('ibm', 400, false, null)
    RETURNING id, add_date, amt, paid, paid_date
  `);
  invoice = invoiceResults.rows[0];
});

describe('GET /invoices', function () {
  test('Gets a list of 4 invoices', async function () {
    const response = await request(app).get('/invoices');
    expect(response.body.invoices.length).toEqual(4);
  });
});

describe('GET /invoices/:id', function () {
  test('Gets a single invoice', async function () {
    const response = await request(app).get(`/invoices/${invoice.id}`);
    expect(response.body).toEqual({
      invoice: {
        id: invoice.id,
        amt: invoice.amt,
        paid: invoice.paid,
        add_date: expect.anything(),
        paid_date: invoice.paid_date,
        company: company
      }
    });
  });
  test('Gets a nonexistent invoice', async function () {
    const response = await request(app).get(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});

describe('POST /invoices', function () {
  test('Creates a new invoice', async function () {
    const response = await request(app)
      .post('/invoices')
      .send({
        comp_code: 'apple',
        amt: 500
      });
  })
})

describe('PUT /invoices/:id', function () {
  test('Updates a single invoice', async function () {
    const response = await request(app)
      .put(`/invoices/${invoice.id}`)
      .send({
        amt: 1000,
        paid: true
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body.invoice.amt).toEqual(1000);
    expect(response.body.invoice.paid).toEqual(true);
  });
})

describe('DELETE /invoices/:id', function () {
  test('Deletes a single invoice', async function () {
    const response = await request(app)
      .delete(`/invoices/${invoice.id}`);
    expect(response.body.status).toEqual('deleted');
  })
})

afterEach(async function () {
  // delete any data created by test
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");
});

afterAll(async function () {
  // close db connection
  await db.end();
});