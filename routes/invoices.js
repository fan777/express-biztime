const express = require('express');
const router = new express.Router();
const db = require('../db')
const ExpressError = require('../expressError')

router.get('/', async function (req, res, next) {
  try {
    const query = await db.query(
      `SELECT id, comp_code
       FROM invoices`
    );

    return res.json({ invoices: query.rows });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async function (req, res, next) {
  try {
    const query = await db.query(
      `SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, i.comp_code, c.name, c.description
       FROM invoices AS i
       JOIN companies AS c
       ON comp_code = code
       WHERE id = $1`, [req.params.id]
    );

    if (query.rows.length === 0)
      throw new ExpressError(`There is no invoice with id '${req.params.id}'`, 404);

    const data = query.rows[0];
    const invoice = {
      id: data.id,
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description
      }
    }

    return res.json({ invoice: invoice });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async function (req, res, next) {
  try {
    const query = await db.query(
      `INSERT INTO invoices (comp_code, amt)
       VALUES ($1, $2)
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [req.body.comp_code, req.body.amt]
    );

    return res.status(201).json({ invoice: query.rows[0] });  // 201 CREATED
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', async function (req, res, next) {
  try {
    let { amt, paid } = req.body;

    if ('id' in req.body) {
      throw new ExpressError('Not allowed to update id', 400);
    }

    const query = await db.query(
      `SELECT paid_date
       FROM invoices
       WHERE id = $1`,
      [req.params.id]
    );

    if (query.rows.length === 0)
      throw new ExpressError(`There is no invoice with id '${req.params.id}'`, 404);

    let paid_date = query.rows[0].paid_date;

    if (paid && !paid_date)
      paid_date = new Date();
    else if (!paid)
      paid_date = null;

    const update = await db.query(
      `UPDATE invoices
       SET amt = $1, paid = $2, paid_date = $3
       WHERE id = $4
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paid_date, req.params.id]
    );

    return res.status(201).json({ invoice: update.rows[0] });  // 201 CREATED
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async function (req, res, next) {
  try {
    const query = await db.query(
      `DELETE FROM invoices
       WHERE id = $1
       RETURNING code`, [req.params.id]
    );

    if (query.rows.length === 0)
      throw new ExpressError(`There is no invoice with id '${req.params.id}'`, 404);

    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;