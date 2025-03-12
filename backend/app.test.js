// app.test.js
const request = require('supertest');
const app = require('./app'); // Import your app

describe('GET /api/test', () => {
  it('should return a 200 status and a message', async () => {
    const response = await request(app).get('/api/test');
    
    expect(response.status).toBe(200); // Assert that the status code is 200
    expect(response.body.message).toBe('Project tested '); // Assert that the response body has the correct message
  });
});
