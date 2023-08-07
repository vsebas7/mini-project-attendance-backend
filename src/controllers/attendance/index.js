import { Attendances, Shift } from "../../models/all_models.js";
import { Op, QueryTypes } from "sequelize";
import moment from "moment";
import db from "../../models/index.js"
import * as validation from "./validation.js"
import * as errorMiddleware from "../../middleware/error.handler.js"

export const clockIn = async (req, res, next) => {
    const transaction = await db.sequelize.transaction()

    try{
        const { id, shift } = req.user

        const clockIn =moment(`'${req.body.clock_in}'`, 'HH:mm')

        const {dataValues} = await Shift.findOne({where : {id : shift}})

        const shift_start = moment(`'${dataValues.start}'`,'HH:mm').add('30','m')

        const clockInTolerate = moment(`'${dataValues.start}'`,'HH:mm').add('30','m').subtract('1','h')
        
        if(clockIn.isBefore(clockInTolerate)) throw({
            status : errorMiddleware.BAD_REQUEST_STATUS,
            message : errorMiddleware.CLOCK_IN_NOT_YET_OPEN
        })

        if(clockIn.isAfter(shift_start)) throw({
            status : errorMiddleware.BAD_REQUEST_STATUS,
            message : errorMiddleware.CLOCK_IN_CLOSED
        })

        await validation.ClockInValidationSchema.validate(req.body)

        const attendanceExist = await Attendances?.findOne({where : {userId : id}})

        if(!attendanceExist) throw({
            status : errorMiddleware.BAD_REQUEST_STATUS,
            message : errorMiddleware.CLOCK_IN_ALREADY_EXISTS
        })

        await Object.assign(req.body,{
            userId : id,
            salary : 50000
        })

        const attendance = await Attendances.create(
            req.body,
            {
                where : {id}
            }
        )

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

        const clockOut =moment(`'${req.body.clock_out}'`, 'HH:mm')

        const {dataValues} = await Shift.findOne({where : {id : shift}})

        const shift_end = moment(`'${dataValues.end}'`,'HH:mm')

        const clockOutTolerate = moment(`'${dataValues.end}'`,'HH:mm').add('1','h')
        
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

        await Object.assign(req.body,{
            userId : id,
            salary : 100000
        })

        await Attendances.update(
            req.body,
            {
                where : {date}
            }
        )

        const attendance = await Attendances.findOne({
            where : {
                userId : id,
                date,
            },
            attributes : {
                exclude : ['createdAt','updatedAt']
            }
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
        const {page} = req.query

        const options = {
            offset: page > 1 ? parseInt(page - 1) * 10 : 0,
        }

        page ? options.limit = 10 : ""

        const history = await Attendances.findAll({
            ...options,
            where : {
                userId : req.user.id
            },
            attributes : {
                exclude : ['id','userId','createdAt','updatedAt']
            },
            order : [
                ['date','DESC']
            ]
        })

        if(!history.length) throw ({ 
            status : errorMiddleware.NOT_FOUND_STATUS, 
            message : errorMiddleware.DATA_NOT_FOUND 
        });

        const total = await Attendances?.count({where : {userId:req.user.id}});

        const pages = Math.ceil(total / options.limit ? options.limit : 1  );

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

export const payrollEmployee = async (req, res, next) => {
    try{
        const { startDate, endDate, employeeId } = req.query

        const payroll = await db.sequelize.query(
            `SELECT 
                SUM(salary) as amount, 
                userId,
                COUNT(id) as total_attendances
            FROM mini_project_attendance.attendances
            ${startDate ? `WHERE date BETWEEN '${startDate}' AND '${endDate}'` : ""}
            GROUP BY userId
            ${employeeId ? `HAVING userId ${employeeId}` : ""}`,
            { type: QueryTypes.SELECT }
        )

        if(!payroll.length) throw ({ 
            status : errorMiddleware.NOT_FOUND_STATUS, 
            message : errorMiddleware.DATA_NOT_FOUND 
        });

        res.status(200).json({
            type : "success",
            message : "Data berhasil dimuat",
            payroll : payroll
        })

    } catch (error) {
        next(error)
    }
}

export const deductionPayroolEmployee = async (req, res, next) => {
    try{
        const { startDate, endDate, employeeId } = req.query

        const payroll = await db.sequelize.query(
            `SELECT 
                SUM(salary) as total_deduction_amount, 
                userId,
                COUNT(id) as deduction_day
            FROM mini_project_attendance.attendances
            WHERE ${startDate ? `date BETWEEN '${startDate}' AND '${endDate}' AND` : ""}
            clock_out LIKE '00:00:00' OR clock_out IS NULL 
            GROUP BY userId
            ${employeeId ? `HAVING userId ${employeeId}` : ""}`,
            { type: QueryTypes.SELECT }
        )

        if(!payroll.length) throw ({ 
            status : errorMiddleware.NOT_FOUND_STATUS, 
            message : errorMiddleware.DATA_NOT_FOUND 
        });

        res.status(200).json({
            type : "success",
            message : "Data berhasil dimuat",
            deduction : payroll
        })

    } catch (error) {
        next(error)
    }
}