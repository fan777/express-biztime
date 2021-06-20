// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let company;
let invoices;

beforeEach(async function () {
  let companyResult = await db.query(`
    INSERT INTO companies
    VALUES ('apple', 'Apple', 'Take a bite out of a computer'),
      ('ibm', 'IBM', 'Big blue.')
      RETURNING code, name, description
  `);
  company = companyResult.rows[0];

  await db.query(`
    INSERT INTO invoices (comp_Code, amt, paid, paid_date)
    VALUES ('apple', 100, false, null),
      ('apple', 200, false, null),
      ('apple', 300, true, '2018-01-01'),
      ('ibm', 400, false, null)
  `);

  let invoiceResults = await db.query(`
    SELECT id FROM invoices WHERE comp_code = 'apple'
  `);
  invoices = invoiceResults.rows.map(inv => inv.id);
  company.invoices = invoices;
});

describe('GET /companies', function () {
  test('Gets a list of 2 companies', async function () {
    const response = await request(app).get('/companies');
    expect(response.body.companies.length).toEqual(2);
  });
});

describe('GET /companies/:code', function () {
  test('Gets a single company', async function () {
    const response = await request(app).get(`/companies/${company.code}`);
    expect(response.body).toEqual({ company: company })
  });
  test('Gets a nonexistent company', async function () {
    const response = await request(app).get('/companies/dog');
    expect(response.statusCode).toEqual(404);
  });
});

describe('POST /companies', function () {
  test('Creates a new company', async function () {
    const response = await request(app)
      .post('/companies')
      .send({
        name: 'Google',
        description: 'Search everything'
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      company: {
        code: expect.any(String),
        name: 'Google',
        description: 'Search everything'
      }
    });
  });
});

describe('PUT /companies/:code', function () {
  test('Updates a single company', async function () {
    const response = await request(app)
      .put(`/companies/${company.code}`)
      .send({
        name: company.name,
        description: "this is a test now"
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body.company.description).toEqual('this is a test now');
  });
});

describe('DELETE /companies/:code', function () {
  test('Deletes a single company', async function () {
    const response = await request(app)
      .delete(`/companies/${company.code}`);
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