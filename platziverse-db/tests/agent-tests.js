'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const agentFixtures = require('./fixtures/agent')

let config = {
  logging: function () {}

}

let MetricStub = {
  belongsTo : sinon.spy()
}

let single = Object.assign({},agentFixtures.single)
let id = 1
let uuid = 'yyy-yyy-yyy'
let AgentStub = null
let db = null
let sandbox = null
let uuidArgs = {
  where:{
    uuid:uuid
  }
}

/**
 * beforeEach significa antes de comenzar las pruebas.
 */
test.beforeEach(async () => {
  sandbox = sinon.createSandbox()
  AgentStub = {
    hasMany : sandbox.spy()
  }
  
  //Model findOne Stub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  //Model findById Stub
  AgentStub.findById = sandbox.stub()
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixtures.byId(id)))

  //Model createOrUpdate Stub
  AgentStub.update = sandbox.stub()
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single))

  const setupDatabase = proxyquire('../',{
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })
  //const setupDatabase = require('../')
  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sandbox.restore()
})

test('Agent', t => {
  t.truthy(db.Agent, 'Agent service should exist')
})

test.serial('Setup', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the MetricModel')
  t.true(MetricStub.belongsTo.called, 'MetricStub.belongTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})

test.serial('Agent#findById',async t =>{
  let agent = await db.Agent.findById(id)

  t.true(AgentStub.findById.called, 'findById should be called on model')
  t.true(AgentStub.findById.calledOnce, 'findById should be called once')
  t.true(AgentStub.findById.calledWith(id), 'findById should be called with specifed id')

  t.deepEqual(agent, agentFixtures.byId(id), 'Should be the same')
})

test.serial('Agent#createOrUpdate - Exsists', async t =>{
  let agent = await db.Agent.createOrUpdate(single)

  t.true(AgentStub.findOne.called, 'findOne should be called on model')
  t.true(AgentStub.findOne.calledTwice, 'findOne should be called twiece')
  t.true(AgentStub.update.calledOnce, 'findOne should be called once')



  t.deepEqual(agent, single, 'agent should be the same')
})

test('make it pass', t => {
  t.pass()
})
