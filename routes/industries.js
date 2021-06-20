const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError')

router.get('/', async function (req, res, next) {
  try {
    const query = await db.query(
      `SELECT i.code, i.industry, c.code AS comp_code
       FROM industries i
       LEFT JOIN industries_companies ic ON i.code = ic.ind_code
       LEFT JOIN companies c ON ic.com_code = c.code
       ORDER BY i.code`
    );

    const industries = query.rows.reduce((map, e) => {
      if (map.has(e.code)) {
        map.get(e.code).com_codes.push(e.comp_code);
      } else {
        map.set(e.code, {
          code: e.code,
          industry: e.industry,
          com_codes: [(e.comp_code)]
        })
      }
      return map;
    }, new Map());

    return res.json({ industries: [...industries.values()] });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async function (req, res, next) {
  try {
    let { code, industry } = req.body;

    const query = await db.query(
      `INSERT INTO ind_code, com_code 
       VALUES ($1, $2)
       RETURNING code, industry`,
      [code, industry]
    );

    return res.status(201).json({ industry: query.rows[0] });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;