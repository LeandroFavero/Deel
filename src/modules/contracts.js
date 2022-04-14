const { Op } = require("sequelize");
const { ProfileTypeEnum, ContractStatusEnum } = require('../enums')

const contracts = (app) => {

    /**
    * Task 2 - Returns a list of contracts belonging to a user (client or contractor), 
    * the list should only contain non terminated contracts.
    * @returns [contracts]
    */
    app.get('/contracts', async (req, res) => {
        const { Contract } = req.app.get('models')
        const { id, type } = req.profile.dataValues

        const where = { status: { [Op.ne]: ContractStatusEnum.Terminated } }
        if (type == ProfileTypeEnum.Contractor)
            where.ContractorId = id
        else
            where.ClientId = id

        const contracts = await Contract.findAll({ where })
        res.json(contracts)
    })

    /**
    * @returns contract by id
    */
    app.get('/contracts/:id', async (req, res) => {
        const { Contract } = req.app.get('models')
        const { id } = req.params
        const contract = await Contract.findOne({ where: { id } })
        if (!contract) return res.status(404).end()

        //Task 1 - it should return the contract only if it belongs to the profile calling
        if (contract.ClientId != req.profile.dataValues.id) return res.status(401).end()

        res.json(contract)
    })


}


module.exports = {
    contracts
};