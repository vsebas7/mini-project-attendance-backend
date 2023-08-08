import { Op, QueryTypes } from "sequelize";
import db from "../../models/index.js"
import * as errorMiddleware from "../../middleware/error.handler.js"

export const payrollEmployee = async (req, res, next) => {
    try{
        const { startDate, endDate, employeeId } = req.query

        const payroll = await db.sequelize.query(
            `SELECT 
                SUM(salary) as amount, 
                userId,
                COUNT(id) as attendances_day
            FROM mini_project_attendance.attendances
            ${startDate ? `WHERE date BETWEEN '${startDate}' AND '${endDate}'` : ""}
            GROUP BY userId
            ${employeeId ? `HAVING userId = ${employeeId}` : ""}`,
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

export const deductionPayrollEmployee = async (req, res, next) => {
    try{
        const { startDate, endDate, employeeId } = req.query

        const payroll = await db.sequelize.query(
            `SELECT 
                SUM(salary) as amount, 
                userId,
                COUNT(id) as deduction_day
            FROM mini_project_attendance.attendances
            WHERE ${startDate ? `date BETWEEN '${startDate}' AND '${endDate}' AND` : ""}
            clock_out LIKE '00:00:00' OR clock_out IS NULL 
            GROUP BY userId
            ${employeeId ? `HAVING userId = ${employeeId}` : ""}`,
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