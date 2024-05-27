const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { expect } = require('chai');
const Issue = require('../models/issue');
const { ObjectId } = require('mongodb');

chai.use(chaiHttp);

var idGenerated = null;

suite('Functional Tests', function() {
    suite('POST', () =>{
        test('With every field filled in', done => {
            chai
            .request(server)
            .post('/api/issues/apitest')
            .send({
                assigned_to: 'Kenobi',
                status_text: 'Not yet completed',
                issue_title: 'to be deleted',
                issue_text: 'Auth error',
                created_by: 'Anakin',
            })
            .end((err, res) => {
                assert.equal(res.status, 200)
                assert.equal(res.body.assigned_to, 'Kenobi')
                assert.equal(res.body.status_text, 'Not yet completed')
                assert.equal(res.body.issue_title, 'to be deleted')
                assert.equal(res.body.issue_text, 'Auth error')
                assert.equal(res.body.created_by, 'Anakin')
                idGenerated = res.body._id;
                done()
            })
        })

        test('With only required fields', done => {
            chai
            .request(server)
            .post('/api/issues/apitest')
            .send({
                issue_title: 'to be deleted',
                issue_text: 'Auth error',
                created_by: 'Anakin',
            })
            .end((err, res) => {
                assert.equal(res.status, 200)
                assert.equal(res.body.issue_title, 'to be deleted')
                assert.equal(res.body.issue_text, 'Auth error')
                assert.equal(res.body.created_by, 'Anakin')
                assert.equal(res.body.assigned_to, '')
                assert.equal(res.body.status_text, '')
                done()
            })
        })

        test('With missing required fields', done => {
            chai
            .request(server)
            .post('/api/issues/apitest')
            .send({
                issue_title: 'Text',
            })
            .end((err, res) => {
                assert.equal(res.body.error, 'required field(s) missing')
                done()
            })
        })
    })

    suite('GET', () =>{
        test('Obtain an array of all issues for specific project', done => {
            chai
            .request(server)
            .get('/api/issues/apitest')
            .query({})
            .end((err, res) => {
                assert.equal(res.status, 200)
                assert.isArray(res.body, 'is array')
                assert.property(res.body[0], 'assigned_to')
                assert.property(res.body[0], 'status_text')
                assert.property(res.body[0], 'open')
                assert.property(res.body[0], 'issue_title')
                assert.property(res.body[0], 'issue_text')
                assert.property(res.body[0], 'created_by')
                assert.property(res.body[0], 'created_on')
                assert.property(res.body[0], 'updated_on')
                done()
            })
        })

        test('Apply one filter', done => {
            chai
            .request(server)
            .get('/api/issues/apitest')
            .query({created_by: 'Anakin'})
            .end((err, res) => {
                assert.isArray(res.body, 'is array')
                res.body.forEach(issue => {
                    assert.equal(issue.created_by, 'Anakin')
               })
               done()
            })
        })

        test('Apply multiple filters', done => {
            chai
            .request(server)
            .get('/api/issues/apitest')
            .query({created_by: 'Anakin'}, {open: true})
            .end((err, res) => {
                assert.isArray(res.body, 'is array')
                res.body.forEach(issue => {
                    assert.equal(issue.created_by, 'Anakin')
                    assert.equal(issue.open, true)
               })
               done()
            })
        })
    })

    suite('PUT', () =>{
        test('Update one field', done => {
            chai
            .request(server)
            .put('/api/issues/apitest')
            .send({_id: idGenerated, created_by: 'Anakin'})
            .end((err, res) => {
                assert.equal(res.body.result, 'successfully updated')
                assert.equal(res.body._id, idGenerated)
                done()
            })
        })

        test('Update multiple fields', done => {
            chai
            .request(server)
            .put('/api/issues/apitest')
            .send({_id: idGenerated, created_by: 'Anakin', issue_text: 'Grand Master'})
            .end((err, res) => {
                assert.equal(res.body.result, 'successfully updated')
                assert.equal(res.body._id, idGenerated)
                done()
            })
        })

        test('Update issue with missing id', done => {
            chai
            .request(server)
            .put('/api/issues/apitest')
            .send({})
            .end((err, res) => {
                assert.equal(res.body.error, 'missing _id')
                done()
            })
        })

        test('Update issue with no fields to update', done => {
            chai
            .request(server)
            .put('/api/issues/apitest')
            .send({_id: idGenerated})
            .end((err, res) => {
                assert.equal(res.body.error, 'no update field(s) sent')
                assert.equal(res.body._id, idGenerated)
                done()
            })
        })

        test('Update issue with invalid id', done => {
            chai
            .request(server)
            .put('/api/issues/apitest')
            .send({_id: '60f1bee4521da62c5ccd7641', issue_text:'Padawan'})
            .end((err, res) => {
                assert.equal(res.body.error, 'could not update')
                assert.equal(res.body._id, '60f1bee4521da62c5ccd7641')
                done()
            })
        })
    })

    suite('DELETE', () =>{
        test('Delete an issue', async () => {
            const toDelete = await Issue.findOne({issue_title: 'to be deleted'}).exec()
            chai
            .request(server)
            .delete('/api/issues/apitest')
            .send({_id: toDelete._id})
            .end((err, res) => {
                assert.equal(res.body.result, 'successfully deleted')
                assert.equal(res.body._id, ObjectId(toDelete._id).toString())
            })
        })

        test('Invalid id', done => {
            chai
            .request(server)
            .delete('/api/issues/apitest')
            .send({_id: '60f1c7cd0e7e0e0a74771d25'})
            .end((err, res) => {
                assert.equal(res.body.error, 'could not delete')
                assert.equal(res.body._id, '60f1c7cd0e7e0e0a74771d25')
                done()
            })
        })

        test('Missing id', done => {
            chai
            .request(server)
            .delete('/api/issues/apitest')
            .send({})
            .end((err, res) => {
                assert.equal(res.body.error, 'missing _id')
                done()
            })
        })
    })
});