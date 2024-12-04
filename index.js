const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
app.use(cors());
app.use(express.json());
const PORT = 1234;

// Making the index for keywords
const index = new Map();
let articles = JSON.parse(fs.readFileSync('./articles.json','utf8'));
articles.forEach((doc) => {
	const content = doc.content;
	const words = content
		.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")	// To remove all special symbols
		.replace(/\s{2,}/g, ' ')	// To remove any double spaces created
		.split(' ');
	words.forEach((word) => {
		const lower = word.toLowerCase();
		if (index.has(lower) === false) {
			index.set(lower, [])
		}
		index.get(lower).push(doc);
	})
});

// Adding new articles
app.post('/articles', (request, response) => {
	const newArticle = request.body; // Get the new article data from the request body

	// Validate the new article
	if (!newArticle.id || !newArticle.link || !newArticle.content) {
		return response.status(400).json({ message: 'ID, link, and content are required' });
	}

	// Check if the article with the same ID already exists
	if (articles.find(article => article.link === newArticle.link)) {
		return response.status(409).json({ message: 'Article with this content already exists' });
	}

	// Add the new article to the articles array
	articles.push(newArticle);

	// Write the updated articles array back to the file
	fs.writeFile('./articles.json', JSON.stringify(articles, null, 2), (err) => {
		if (err) {
			console.error(err);
			return response.status(500).json({ message: 'Error saving article' });
		}
		response.status(201).json(newArticle); // Respond with the newly created article
	});
});

// Searching by keyword
app.get('/search', (request, response) => {
	const keyword = request.query.searchInput; // Get the searchInput from query parameters
	if (!keyword) {
		return response.status(400).json({ error: 'Keyword is required' });
	}

	const lowerKeyword = keyword.toLowerCase(); // Convert keyword to lowercase
	const results = index.get(lowerKeyword) || []; // Search in the index

	response.json(results); // Return the results as JSON
});

// Searching by ID
app.get('/articles/:id', (req, res) => {
	console.log(articles)
	const articleId = parseInt(req.params.id, 10); // Get the ID from the URL and convert it to an integer
	const article = articles.find(article => article.id === articleId); // Find the article by ID

	if (article) {
		res.status(200).json(article); // Return the article if found
	} else {
		res.status(404).json({ message: 'Article not found' }); // Return a 404 if not found
	}
});

const server = app.listen(PORT, () => console.log(`Server listening on port:${PORT}`));