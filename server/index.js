require('dotenv/config');
const express = require('express');

const db = require('./database');
const ClientError = require('./client-error');
const staticMiddleware = require('./static-middleware');
const sessionMiddleware = require('./session-middleware');

const app = express();

app.use(staticMiddleware);
app.use(sessionMiddleware);

app.use(express.json());

app.get('/api/health-check', (req, res, next) => {
  db.query('select \'successfully connected\' as "message"')
    .then(result => res.json(result.rows[0]))
    .catch(err => next(err));
});

app.get('/api/products', (req, res, next) => {
  const sql = `
  select "productId",
              "name",
              "price",
              "image",
    "shortDescription"
  from "products"
  `;
  db.query(sql)
    .then(result => res.json(result.rows))
    .catch(err => next(err));
});

app.get('/api/products/:productId', (req, res, next) => {
  const sql = `
  select *
    from "products"
    where "productId" = $1
  `;
  const id = [req.params.productId];
  db.query(sql, id)
    .then(result => {
      const product = result.rows[0];
      if (!product) {
        next(new ClientError(`Cannot find product with "productId" ${id}`, 404));
      } else {
        res.json(product);
      }
    })
    .catch(err => next(err));
});

app.get('/api/cart', (req, res, next) => {
  res.json([]);
});

app.post('/api/cart', (req, res, next) => {
  const { productId } = req.body;
  const productIdInt = parseInt(productId);
  if (!Number.isInteger(productIdInt) || productIdInt <= 0) {
    next(new ClientError('productId must be a positive number', 400));
  }
  const sql = `
  select "price",
      "productId"
    where "productId" = $1
  `;
  db.query(sql, productId)
    .then()
    .then()
    .then()
    .catch(err => next(err));
});

app.use('/api', (req, res, next) => {
  next(new ClientError(`cannot ${req.method} ${req.originalUrl}`, 404));
});

app.use((err, req, res, next) => {
  if (err instanceof ClientError) {
    res.status(err.status).json({ error: err.message });
  } else {
    console.error(err);
    res.status(500).json({
      error: 'an unexpected error occurred'
    });
  }
});

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log('Listening on port', process.env.PORT);
});
