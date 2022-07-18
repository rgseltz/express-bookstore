process.env.NODE_ENV = 'test';
const db = require('../db');
const request = require('supertest');
const app = require('../app');

let testBook;

beforeEach(async () => {
	const results = await db.query(
		`INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year) VALUES ('074532699', 'http://amazon/hpsorcerer.com', 'J.K. Rowling', 'english', 223, 'Bloomsbury', 'Harry Potter and the Sorcerer''s Stone', 1997 ) RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`
	);
	testBook = results.rows[0];
});

afterEach(async () => {
	await db.query(`DELETE FROM books;`);
});

afterAll(async () => {
	await db.end();
});

describe('test setup', () => {
	test('test book', () => {
		console.log(testBook);
		expect(1).toBe(1);
	});
});

describe('GET /books', () => {
	test('GET a list of all books', async () => {
		const result = await request(app).get('/books');
		expect(result.statusCode).toBe(200);
		// console.log()
		expect(result.body).toEqual({ books: [ testBook ] });
	});
	test('GET list of single book by isbn', async () => {
		const result = await request(app).get(`/books/${testBook.isbn}`);
		expect(result.statusCode).toBe(200);
	});
});

describe('POST /books', () => {
	test('Add new book', async () => {
		const result = await request(app).post('/books').send({
			isbn: '0691161518',
			'amazon-url': 'http://a.co/eobPtX2',
			author: 'Matthew Lane',
			language: 'english',
			pages: 264,
			publisher: 'Princeton University Press',
			title: 'Power-Up: Unlocking Hidden Math in Video Games',
			year: 2017
		});
		expect(result.statusCode).toBe(201);
		expect(result.body).toEqual(result.body);
	});
	test('Add new book missing data properties', async () => {
		const resultNoYear = await request(app).post('/books').send({
			isbn: '0691161518',
			'amazon-url': 'http://a.co/eobPtX2',
			author: 'Matthew Lane',
			language: 'english',
			pages: 264,
			publisher: 'Princeton University Press',
			title: 'Power-Up: Unlocking Hidden Math in Video Games'
		});
		console.log(resultNoYear.text);
		expect(resultNoYear.statusCode).toBe(400);
		expect(resultNoYear.text).toContain(
			'{"error":{"message":["instance requires property \\"year\\""],"status":400},"message":["instance requires property \\"year\\""]}'
		);
	});
	test('Add new book with incorrect data types', async () => {
		const resultYearString = await request(app).post('/books').send({
			isbn: '0691161518',
			'amazon-url': 'http://a.co/eobPtX2',
			author: 'Matthew Lane',
			language: 'english',
			pages: 264,
			publisher: 'Princeton University Press',
			title: 'Power-Up: Unlocking Hidden Math in Video Games',
			year: '2017'
		});
		expect(resultYearString.statusCode).not.toBe(201);
		const resultPagesString = await request(app).post('/books').send({
			isbn: '0691161518',
			'amazon-url': 'http://a.co/eobPtX2',
			author: 'Matthew Lane',
			language: 'english',
			pages: '264',
			publisher: 'Princeton University Press',
			title: 'Power-Up: Unlocking Hidden Math in Video Games',
			year: 2017
		});
		expect(resultPagesString.status).not.toBe(201);
	});
});
