// backend/app.test.js
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const app = require('./app'); 
const userModel = require('../backend/model/user');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

chai.use(chaiHttp);
const expect = chai.expect;

describe('App API', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  // test endpoint
  describe('GET /api/test', () => {
    it('should return a 200 status and a message', (done) => {
      chai.request(app)
        .get('/api/test')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message', 'Project tested');
          done();
        });
    });
  });

  describe('POST /users/login', () => { 
    it('should login successfully with valid credentials', async () => {
      const userStub = {
        _id: '67bee58a55afc94bff8137bc', 
        email: 'youssefbenarous@gmail.com',
        password: await bcryptjs.hash('azerty123', 10),
        role: 'BUSINESS_OWNER' 
      };
  
      sandbox.stub(userModel, 'findOne').resolves(userStub);
      sandbox.stub(bcryptjs, 'compare').resolves(true);
      sandbox.stub(jwt, 'sign').returns('fake-token');
  
      const res = await chai.request(app)
        .post('/users/login') 
        .send({
          email: 'youssefbenarous@gmail.com',
          password: 'azerty123' 
        });
  
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('token', 'fake-token');
      expect(res.body).to.have.property('role', 'BUSINESS_OWNER');
    });
  });
  /*describe('PUT /users/update-firstlogin', () => {
    it('should update firstlogin to false for a user', async () => {
      const userId = '67d15c34ea844b95d23a1785';
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2QxNWMzNGVhODQ0Yjk1ZDIzYTE3ODUiLCJmdWxsbmFtZSI6IllvdXNzZWYiLCJlbWFpbCI6InlvdXNzZWZiZW5hcm91c0BnbWFpbC5jb20iLCJyb2xlIjoiQlVTSU5FU1NfT1dORVIiLCJpYXQiOjE3NDE3NzM4NzgsImV4cCI6MTc0MTg2MDI3OH0.YGHUxda65L7pjJTsIG43zJwaJvMN_tdKUNxdl9938-s";

      const userStub = {
        _id: userId,
        firstlogin:   true,
        save: sandbox.stub().resolves({ _id: userId, firstlogin: false })
      };

      sandbox.stub(userModel, 'findById').resolves(userStub);

      const res = await chai.request(app)
        .put('/users/update-firstlogin')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message', 'firstlogin mis à jour à false');
      expect(userStub.save.calledOnce).to.be.true;
    });

    it('should return 404 if user not found', async () => {
      const userId = '67d15c34ea844b95d23a1785';
      const token = jwt.sign({ userId }, process.env.SECRET_KEY);

      sandbox.stub(userModel, 'findById').resolves(null);

      const res = await chai.request(app)
        .put('/users/update-firstlogin')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('message', 'Utilisateur non trouvé');
    });
  });*/
  describe('POST /users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        _id: '67bee58a55afc94bff8137bcc', 
        lastname: 'youssef',
        fullname:'ben arous',
        email: 'youssefbenarous2@gmail.com',
        password: 'azerty123',
        role: 'BUSINESS_OWNER',
        confirm: 'azerty123'
      };

      sandbox.stub(userModel, 'findOne').resolves(null); // No existing user
      sandbox.stub(userModel.prototype, 'save').resolves(); // Mock save

      const res = await chai.request(app)
        .post('/users/register')
        .send(userData);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('message', 'User registered successfully');
      expect(res.body.user).to.deep.equal({
        lastname: 'youssef',
        fullname:'ben arous',
        email: 'youssefbenarous2@gmail.com',
        password: 'azerty123',
        role: 'BUSINESS_OWNER',
        confirm: 'azerty123'
      });
    });

    it('should return 400 if fields are missing', async () => {
      const res = await chai.request(app)
        .post('/users/register')
        .send({ fullname: 'youssefbenarous' }); 

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('message', 'All fields are required');
    });

    it('should return 400 if username or email is taken', async () => {
      const userData = {
        lastname: 'youssef',
        fullname:'ben arous',
        email: 'youssefbenarous2@gmail.com',
        password: 'azerty123',
        role: 'BUSINESS_OWNER',
        confirm: 'azerty123'
      };

      sandbox.stub(userModel, 'findOne').resolves({ username: 'youssefbenarous' });

      const res = await chai.request(app)
        .post('/users/register')
        .send(userData);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('message', 'Username or email already taken');
    });
  });
});