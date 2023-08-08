import { ValidationError } from "yup"
import { Attendances, Salaries, Shift, User } from "../../models/all_models.js"
import handlebars from "handlebars"
import fs from "fs"
import path from "path"
import * as validation from "./validation.js"
import * as config from "../../config/index.js"
import transporter from "../../helpers/transporter.js"
import * as encryption from "../../helpers/encryption.js"
import * as tokenHelper from "../../helpers/token.js"
import * as errorMiddleware from "../../middleware/error.handler.js"
import db from "../../models/index.js"

export const registerEmployee = async (req, res, next) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { email, salary } = req.body;

        await validation.RegisterValidationSchema.validate(req.body);
        const userExists = await User?.findOne({where: {email}});
        if (userExists) throw ({
            type : "error",
            status : errorMiddleware.BAD_REQUEST_STATUS, 
            message : errorMiddleware.EMAIL_ALREADY_EXISTS 
        });

        delete req.body.salary

        const user = await User?.create(req.body);

        const accessToken = tokenHelper.createToken({ 
            id : user?.dataValues?.id,
            email : user?.dataValues?.email,
        });
        const salaries = await Salaries?.create({
            userId : user?.dataValues?.id,
            salary
        });

        const template = fs.readFileSync(path.join(process.cwd(), "templates", "email.html"), "utf8");
        const message  = handlebars.compile(template)({ link : `http://localhost:3000/employee/activate-account/${accessToken}` })
        const mailOptions = {
            from: config.GMAIL,
            to: email,
            subject: "Welcome to Sebas' Bakery Family",
            html: message
        }
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) throw error;
            console.log("Email sent: " + info.response);
        })
        
        res.status(200).json({
            type : "success",
            message: "Activate account via the link sent to that email ",
            user,
            salaries
        });
        
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        if (error instanceof ValidationError) {
            return next({
                status : errorMiddleware.BAD_REQUEST_STATUS, 
                message : error?.errors?.[0]
            })
        }
        next(error)
    }
}

export const activateEmployee = async(req, res, next)=>{
    const transaction = await db.sequelize.transaction()
    try {
        const { email } = req.user

        const { username, phone } = req.body
       
        const linkExpired = await User?.findOne({where : {email,status:1}})
        if(linkExpired) throw({
            type : "error",
            status : errorMiddleware.LINK_EXPIRED_STATUS,
            message : errorMiddleware.LINK_EXPIRED
        })
        const usernameExist = await User?.findOne({where : {username}})
        if(usernameExist) throw({
            type : "error",
            status : errorMiddleware.BAD_REQUEST_STATUS,
            message : errorMiddleware.USERNAME_ALREADY_EXISTS
        })
        const phoneExist = await User?.findOne({where : {phone}})
        if(phoneExist) throw({
            type : "error",
            status : errorMiddleware.BAD_REQUEST_STATUS,
            message : errorMiddleware.PHONE_ALREADY_EXISTS
        })
        await validation.ActivateUserValidationSchema.validate(req.body)
        await Object.assign(req.body,{
            password : encryption.hashPassword(req.body.password),
            status : 1
        })
        delete req.body.confirmPass
        const user = await User?.update(
            req.body,
            {where: {email}}
        )
        res.status(200).json({
            type : "success",
            message: "Account activated successfully",
            accunt : user
        });
        
        await transaction.commit()
    } catch(error){
        await transaction.rollback()
        next(error)
    }
}

export const allEmployee = async (req, res, next) => {
    try {
        const { page } = req.query
        const options = {
            offset: page > 1 ? parseInt(page - 1) * 10 : 0,
            limit : 10
        }
        const employee = await User.findAll({
            ...options,
            where : {roleId : 2},
            attributes :{exclude : ['password','status','roleId']},
            include : [
                {
                    model : Salaries,
                    attributes : ['salary']
                },
                {
                    model : Shift,
                    attributes : {
                        exclude : ['id']
                    }
                }
            ]
        })
        if(!employee.length) throw ({ 
            status : errorMiddleware.NOT_FOUND_STATUS, 
            message : errorMiddleware.DATA_NOT_FOUND 
        });
        const total = await User?.count({where : {roleId:2}});
        const pages = Math.ceil(total / options.limit);
        res.status(200).json({
            type : "success",
            message : "Data berhasil dimuat",
            employee : {
                currentPage: page ? page : 1,
                totalPage : pages,
                total_employee : total,
                employee_limit : options.limit,
                data : employee
            }
        })
    } catch (error) {
        next(error)
    }
}

export const employeeDetail = async (req, res, next) => {
    try {
        const { employeeId } = req.params
        const employee = await User.findOne({where : {id : employeeId}})
        if(!employee) throw ({ 
            status : errorMiddleware.NOT_FOUND_STATUS, 
            message : errorMiddleware.DATA_NOT_FOUND 
        });
        res.status(200).json({
            type : "success",
            message : "Data berhasil dimuat",
            employee : employee
        })
    } catch (error) {
        next(error)
    }
}

export const shiftList = async (req, res, next) => {
    try {
        const shift = await Shift.findAll()
        res.status(200).json({
            type : "success",
            message : "Data berhasil dimuat",
            shift : shift
        })
    } catch (error) {
        next(error)
    }
}