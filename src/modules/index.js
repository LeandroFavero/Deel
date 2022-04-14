//Start all modules of project

const { contracts } = require('./contracts')
const { jobs } = require('./jobs')
const { balances } = require('./balances')
const { admin } = require('./admin')

const modules = (app)=>{
    contracts(app)
    jobs(app)
    balances(app)
    admin(app)
}

module.exports = {
    modules
};