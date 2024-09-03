import express from 'express';

import data from './ai/create.js';
console.log(data);

const app = express();
const port = 3000;

// Middleware to parse JSON data
app.use(express.json());

// Middleware to parse URL-encoded data from forms
app.use(express.urlencoded({ extended: true }));

// Serve the public folder as static
app.use(express.static('public'));

// Routes
app.post('/api/create', (req, res) => {
  console.log(req.body); // Log the form data to the console
  res.redirect('/success.html'); // Redirect to success page
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
