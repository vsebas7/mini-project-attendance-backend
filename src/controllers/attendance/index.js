import { Attendances, Salaries, Shift } from "../../models/all_models.js";
import { Op } from "sequelize";
import moment from "moment";
import db from "../../models/index.js"
import * as validation from "./validation.js"
import * as errorMiddleware from "../../middleware/error.handler.js"

export const clockIn = async (req, res, next) => {
    const transaction = await db.sequelize.transaction()

    try{
        const { id, shift } = req.user
        
        const attendanceExist = await Attendances?.findOne({where : {userId : id,date :`'${moment().format("YYYY-MM-DD")}`}})
       
        if(attendanceExist) throw({
            status : errorMiddleware.BAD_REQUEST_STATUS,
            message : errorMiddleware.CLOCK_IN_ALREADY_EXISTS
        })

        const clockIn =moment(`'${req.body.clock_in}'`, 'HH:mm:ss')
       
        const {dataValues : {start}} = await Shift.findOne({where : {id : shift}})
        
        const {dataValues : {salary}} = await Salaries.findOne({where : {userId : id}})
        
        const salary_day_half = salary/30/2
       
        const shift_start = moment(`'${start}'`,'HH:mm:ss').add('30','m')
       
        const clockInTolerate = moment(`'${start}'`,'HH:mm:ss').add('30','m').subtract('1','h')
        
        if(clockIn.isBefore(clockInTolerate)) throw({
            status : errorMiddleware.BAD_REQUEST_STATUS,
            message : errorMiddleware.CLOCK_IN_NOT_YET_OPEN
        })

        if(clockIn.isAfter(shift_start)) throw({
            status : errorMiddleware.BAD_REQUEST_STATUS,
            message : errorMiddleware.CLOCK_IN_CLOSED
        })
        
        await validation.ClockInValidationSchema.validate(req.body)
        
        await Object.assign(req.body,{
            userId : id,
            salary : salary_day_half
        })
       
        const attendance = await Attendances.create(req.body,{where : {id}})

        res.status(200).json({
            type : "success",
            message : "Clock in berhasil",
            attendance
        })

        await transaction.commit()
    }catch(error){
        await transaction.rollback()
        next(error)
    }
}

export const clockOut = async (req, res, next) => {
    const transaction = await db.sequelize.transaction()

    try{
        const { id, shift } = req.user

        const { date } = req.body

        const clockOutExitst = await Attendances?.findOne({
            where : {
                date : moment(date,"YYYY-MM-DD"),
                userId : id,
                clock_out :{
                    [Op.not]:null
                }
            }
        })

        if(clockOutExitst) throw({
            status : errorMiddleware.BAD_REQUEST_STATUS,
            message : errorMiddleware.CLOCK_OUT_ALREADY_EXISTS
        })

        const clockOut =moment(`'${req.body.clock_out}'`, 'HH:mm:ss')

        const {dataValues : {end}} = await Shift.findOne({where : {id : shift}})
        
        const {dataValues : {salary}} = await Salaries.findOne({where : {userId : id}})

        const salary_day_full = salary/30

        const shift_end = moment(`'${end}'`,'HH:mm:ss')

        const clockOutTolerate = moment(`'${end}'`,'HH:mm:ss').add('1','h')
        
        if(clockOut.isBefore(shift_end)) throw({
            status : errorMiddleware.BAD_REQUEST_STATUS,
            message : errorMiddleware.CLOCK_OUT_NOT_YET_OPEN
        })

        if(clockOut.isAfter(clockOutTolerate)) throw({
            status : errorMiddleware.BAD_REQUEST_STATUS,
            message : errorMiddleware.CLOCK_OUT_CLOSED
        })

        await validation.ClockOutValidationSchema.validate(req.body)

        const clockInExist = await Attendances?.findOne({
            where : {
                date : moment(date,"YYYY-MM-DD"),
                userId : id,
            }
        })

        if(!clockInExist) throw({
            status : errorMiddleware.NOT_FOUND_STATUS,
            message : errorMiddleware.CLOCK_IN_NOT_FOUND
        })

        await Object.assign(req.body,{
            userId : id,
            salary : salary_day_full
        })

        await Attendances.update(req.body,{where : {date}} )

        const attendance = await Attendances.findOne({
            where : {
                userId : id,
                date,
            },
            attributes : {exclude : ['createdAt','updatedAt']}
        })

        res.status(200).json({
            type : "success",
            message : "Clock out berhasil",
            attendance
        })

        await transaction.commit()
    }catch(error){
        await transaction.rollback()
        next(error)
    }
}

export const historyAttendance = async (req, res, next) => {
    try{
        const { page, date, startDate, endDate, employeeId} = req.query

        const options = { offset: page > 1 ? parseInt(page - 1) * 5 : 0, }

        page ? options.limit = 5 : ""

        const filter = {userId : employeeId ? employeeId : req.user.id}

        date ? filter.date = `'${date}'` : ""

        startDate && endDate ? Object.assign(filter,{date :{[Op.between]: [startDate, endDate]}}):""

        const history = await Attendances.findAll({
            ...options,
            where : filter,
            attributes : {
                exclude : ['id','userId','createdAt','updatedAt']
            },
            order : [['date','DESC']]
        })

        if(!history.length) throw ({ 
            status : errorMiddleware.NOT_FOUND_STATUS, 
            message : errorMiddleware.DATA_NOT_FOUND 
        });

        const total = await Attendances?.count({where : filter});

        const pages = Math.ceil(total / options.limit );

        res.status(200).json({
            type : "success",
            message : "Data berhasil dimuat",
            attendances : {
                currentPage: page ? page : 1,
                totalPage : pages,
                total_attendances : total,
                attendances_limit : options.limit,
                history : history
            }
        })

    } catch (error) {
        next(error)
    }
}