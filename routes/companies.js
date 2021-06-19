const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError')

router.get('/', async function (req, res, next) {
  try {
    const query = await db.query(
      `SELECT code, name, description
       FROM companies`
    );

    return res.json({ companies: query.rows });
  } catch (err) {
    return next(err);
  }
});

router.get('/:code', async function (req, res, next) {
  try {
    const compQuery = await db.query(
      `SELECT code, name, description
       FROM companies
       WHERE code = $1`, [req.params.code]
    );

    if (compQuery.rows.length === 0)
      throw new ExpressError(`There is no company with code '${req.params.code}'`, 404);

    const invQuery = await db.query(
      `SELECT id 
       FROM invoices
       WHERE comp_code = $1`, [req.params.code]
    );

    const company = compQuery.rows[0];
    const invoices = invQuery.rows;
    company.invoices = invoices.map(inv => inv.id);

    return res.json({ company: company });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async function (req, res, next) {
  try {
    const query = await db.query(
      `INSERT INTO companies (code, name, description)
       VALUES ($1, $2, $3)
       RETURNING code, name, description`,
      [req.body.code, req.body.name, req.body.description]
    );

    return res.status(201).json({ company: query.rows[0] });  // 201 CREATED
  } catch (err) {
    return next(err);
  }
});

router.put('/:code', async function (req, res, next) {
  try {
    if ('code' in req.body) {
      throw new ExpressError('Not allowed to update code', 400);
    }

    const query = await db.query(
      `UPDATE companies
       SET name = $1, description = $2
       WHERE code = $3
       RETURNING code, name,  description`,
      [req.body.name, req.body.description, req.params.code]
    );

    if (query.rows.length === 0)
      throw new ExpressError(`There is no company with code '${req.params.code}'`, 404);

    return res.status(201).json({ company: query.rows[0] });  // 201 CREATED
  } catch (err) {
    return next(err);
  }
});

router.delete('/:code', async function (req, res, next) {
  try {
    const query = await db.query(
      `DELETE FROM companies
       WHERE code = $1
       RETURNING code`, [req.params.code]
    );

    if (query.rows.length === 0)
      throw new ExpressError(`There is no company with code '${req.params.code}'`, 404);

    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;