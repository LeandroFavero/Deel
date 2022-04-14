const { ProfileTypeEnum, ContractStatusEnum } = require('../enums')

const jobs = (app) => {
    /**
    * Task 3 -  ***GET*** `/jobs/unpaid` 
    *  Get all unpaid jobs for a user (***either*** a client or contractor), for ***active contracts only***.
    * contracts are considered active only when in status `in_progress`
    * @returns contract by id
    */
    app.get('/jobs/unpaid', async (req, res) => {
        const { Contract, Job } = req.app.get('models')
        const { id, type } = req.profile.dataValues

        const where = { status: ContractStatusEnum.InProgress }
        if (type == ProfileTypeEnum.Contractor)
            where.ContractorId = id
        else
            where.ClientId = id

        const include = [{
            model: Job,
            required: true,
            where: {
                paid: null
            }
        }]

        const jobs = await Contract.findAll({ where, include })
        res.json(jobs)
    })


    /**
        * Task 4. ***POST*** `/jobs/:job_id/pay` 
        * Pay for a job, 
        * a client can only pay if his balance >= the amount to pay. 
        * The amount should be moved from the client's balance to the contractor balance.
        * @returns contract by id
        */
    app.post('/jobs/:job_id/pay', async (req, res) => {
        const { Contract, Job, Profile } = req.app.get('models')
        const { id, balance } = req.profile.dataValues
        const { job_id } = req.params

        const where = {}

        const include = [{
            model: Job,
            required: true,
            where: {
                id: job_id
            }
        }]

        const jobs = await Contract.findAll(
            {
                attributes: ['ClientId', 'ContractorId'],
                where,
                include
            })

        //Validations
        if (jobs.length == 0) return res.status(404).send('This job or contract was not found')
        if (jobs[0].ClientId != id) return res.status(403).end()
        if (jobs[0].Jobs[0].paid == true) return res.status(406).send('This job has already been paid')
        if (jobs[0].Jobs[0].price > balance) return res.status(406).send('Your balance is insufficient for payment')

        //Pay
        const price = jobs[0].Jobs[0].price
        const { ClientId, ContractorId } = jobs[0]

        //Transaction Operations
        const sequelize = req.app.get('sequelize')
        const t = await sequelize.transaction()
        try {

            await sequelize.transaction(async (t) => {

                //Debit - Client
                await Profile.update({
                    balance: sequelize.literal(`balance - ${price} `),
                },
                    { where: { id: ClientId } },
                    { transaction: t });

                //Credit - Contractor
                await Profile.update({
                    balance: sequelize.literal(`balance + ${price} `),
                },
                    { where: { id: ContractorId } },
                    { transaction: t });

                //Pay - Job
                await Job.update({
                    paid: true,
                    paymentDate: new Date()
                },
                    { where: { id: job_id } },
                    { transaction: t });
            });

            res.status(200).send('Payment made successfully')

        } catch (error) {
            console.log(error)
            res.status(500).send('An error occurred during payment. Please contact our support')
        }

    })
}

module.exports = {
    jobs
};