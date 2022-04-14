const { Op } = require("sequelize");

const balances = (app) => {

    /**
    * Task 5 - ***POST*** `/balances/deposit/:userId` 
    * Deposits money into the the the balance of a client, 
    * a client can't deposit more than 25% his total of jobs to pay. (at the deposit moment)
    * @returns []
    */
    app.post('/balances/deposit/:userId', async (req, res) => {
        const { Contract, Job, Profile } = req.app.get('models')
        const sequelize = req.app.get('sequelize')
        const { userId } = req.params
        const { value } = req.body

        const where = { ClientId: userId }

        const include = [{
            model: Job,
            required: true,
            attributes: [
                [sequelize.fn('sum', sequelize.col('Jobs.price')), 'TotalToPay']
            ],
            where: {
                paid: { [Op.ne]: true }
            }
        }]

        const jobs = await Contract.findAll(
            {
                attributes: ['ClientId'],
                where,
                include
            })


        //Validations
        if (jobs.length == 0) return res.status(404).send('No contracts found')
        if (jobs[0].Jobs == 0) return res.status(404).send('No jobs found')

        //25% -> The best is to turn it into a parameter
        const MaxDeposit = 25
        const TotalToPay = jobs[0].Jobs[0].dataValues.TotalToPay
        const MaxValue = (TotalToPay*MaxDeposit)/100
        if (value > MaxValue)
            return res.status(406).send(`You can only deposit ${MaxDeposit}% of the total to be paid`)

        //Transaction Operations
        const t = await sequelize.transaction()
        try {

            await sequelize.transaction(async (t) => {

                //Credit - Client
                await Profile.update({
                    balance: sequelize.literal(`balance + ${value} `),
                },
                    { where: { id: userId } },
                    { transaction: t });

            });

            res.status(200).send('Deposit made successfully')

        } catch (error) {
            console.log(error)
            res.status(500).send('An error occurred during deposit. Please contact our support')
        }

    })

}


module.exports = {
    balances
};