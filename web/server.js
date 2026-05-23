const express = require('express');
const path = require('path');
const morgan = require('morgan');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/layout');
app.set('layout extractScripts', true);

const contestsRouter = require('./routes/contests');
const registerRouter = require('./routes/register');
const resultsRouter = require('./routes/results');
const queryRouter = require('./routes/query');

app.use('/', contestsRouter);
app.use('/register', registerRouter);
app.use('/results', resultsRouter);
app.use('/query', queryRouter);

app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack || err);
  res.status(err.status || 500);
  const errorObj = typeof err === 'string' ? { message: err } : err;
  res.render('error', { error: errorObj, activeTab: '' });
});

app.listen(PORT, () => {
  console.log(`[OK] Server running at http://localhost:${PORT}`);
});

module.exports = app;
