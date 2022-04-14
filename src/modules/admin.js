const { Op } = require("sequelize");
const dateIsValid = require('date-fns/isValid')
const dateParse = require('date-fns/parse');
const { query } = require("express");

const admin = (app) => {

    /**
    * Task 6 - ***GET*** `/admin/best-profession?start=<date>&end=<date>` 
    * Returns the profession that earned the most money (sum of jobs paid) 
    * for any contactor that worked in the query time range.
    * @returns []
    */
    app.get('/admin/best-profession', async (req, res) => {
        const { start, end } = req.query

        //Validations
        if (!dateIsValid(dateParse(start, 'yyyy-MM-dd', new Date()))) return res.status(400).send('Invalid start date')
        if (!dateIsValid(dateParse(end, 'yyyy-MM-dd', new Date()))) return res.status(400).send('Invalid end date')

        //Query
        const { Contract, Job, Profile } = req.app.get('models')

        const sequelize = req.app.get('sequelize')

        const query = {
            attributes: [
                'ContractId',
                [sequelize.fn('sum', sequelize.col('price')), 'total']
            ],
            where: { paymentDate: { [Op.between]: [start, end] },
         },
            order: [[sequelize.literal('total'), 'DESC']],
            group: ['ContractId'],
            limit: 1,
            include: [{
                model: Contract,
                required: true,
                attributes: ['ContractorId'],
                include: [{
                    model: Profile,
                    required: true,
                    as: 'Contractor',
                    attributes: ['firstName','lastName','profession']
                }]
            }
            ]
        }

        const profession = await Job.findAll(query);
        res.json(profession)
    })


    /**
    * Task 7 - ***GET*** `/admin/best-clients?start=<date>&end=<date>&limit=<integer>` 
    * returns the clients the paid the most for jobs in the query time period. 
    * limit query parameter should be applied, default limit is 2.
    * @returns []
    */
    app.get('/admin/best-clients', async (req, res) => {
        const { start, end, limit } = req.query

        //Validations
        if (!dateIsValid(dateParse(start, 'yyyy-MM-dd', new Date()))) return res.status(400).send('Invalid start date')
        if (!dateIsValid(dateParse(end, 'yyyy-MM-dd', new Date()))) return res.status(400).send('Invalid end date')

        let nLimit = 2
        if (limit!=null){
            nLimit = Math.floor(Number(limit));
            if (!(nLimit !== Infinity && String(nLimit) === limit && nLimit >= 0)) return res.status(400).send('Invalid limit')
        }

        //Query
        const { Contract, Job, Profile } = req.app.get('models')

        const sequelize = req.app.get('sequelize')

        const query = {
            attributes: [
                 [sequelize.col('Contract.ClientId'),'id'],
                 [sequelize.literal("`Contract->Client`.`firstName` || ' ' || `Contract->Client`.`lastName`"), 'fullName'],
                 [sequelize.fn('sum', sequelize.col('price')), 'paid']
            ],
            where: { paymentDate: { [Op.between]: [start, end] } },
            order: [[sequelize.literal('paid'), 'DESC']],
            group: ['ContractId'],
            limit: nLimit,
            include: [{
                model: Contract,
                required: true,
                attributes: [],
                include: [{
                    model: Profile,
                    required: true,
                    as: 'Client',
                    attributes: []
                }]
            }
            ]
        }

        const clients = await Job.findAll(query);
        return res.json(clients)

    })

}


module.exports = {
    admin
};