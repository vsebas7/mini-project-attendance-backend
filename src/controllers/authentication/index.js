import { ValidationError } from "yup"
import { Salaries, User } from "../../models/all_models.js"
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

export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        await validation.LoginValidationSchema.validate(req.body);

        const userExists = await User?.findOne(
            {
                where: {username}
            }
        );

        if (!userExists) throw ({ 
            status : errorMiddleware.BAD_REQUEST_STATUS, 
            message : errorMiddleware.USER_NOT_FOUND 
        })
        
        const isPasswordCorrect = encryption.comparePassword(password, userExists?.dataValues?.password);

        if (!isPasswordCorrect) throw ({ 
            status : errorMiddleware.BAD_REQUEST_STATUS,
            message : errorMiddleware.INCORRECT_PASSWORD 
        });
        
        const accessToken = tokenHelper.createToken({ 
            id: userExists?.dataValues?.id, 
            email : userExists?.dataValues?.email,
            shift : userExists?.dataValues?.shiftHourId
        });
        
        delete userExists?.dataValues?.password;

        res.header("Authorization", `Bearer ${accessToken}`)
            .status(200)
            .json({ 
                type : "success",
                message : "Data berhasil dimuat",
                account : userExists 
            })

    } catch (error) {
        if (error instanceof ValidationError) {
            return next({ 
                status : errorMiddleware.BAD_REQUEST_STATUS, 
                message : error?.errors?.[0] 
            })
        }
        next(error)
    }
}

export const keepLogin = async (req, res, next) => {
    try {
        const user = await User?.findOne(
            { 
                where : {
                    id : req.user
                },
                attributes : {
                    exclude : ["password"]
                }
            }
        );

        res.status(200).json({ 
            type : "success",
            message : "Data berhasil dimuat",
            accunt : user
        })
    } catch (error) {
        next(error)
    }
}

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        await validation.EmailValidationSchema.validate(req.body);

        const isUserExist = await User?.findOne(
            { where : { email } }
        );

        if (!isUserExist) throw ({ 
            status : errorMiddleware.BAD_REQUEST_STATUS, 
            message : errorMiddleware.EMAIL_NOT_FOUND 
        })

        const accessToken = tokenHelper.createToken({ 
            id : isUserExist?.dataValues?.id,
            email : isUserExist?.dataValues?.email,
        });

        const template = fs.readFileSync(path.join(process.cwd(), "templates", "email.html"), "utf8");

        const message  = handlebars.compile(template)({ link : `http://localhost:3000/reset-password/${accessToken}` })

        const mailOptions = {
            from: config.GMAIL,
            to: email,
            subject: "Reset Password",
            html: message
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) throw error;
            console.log("Email sent: " + info.response);
        })

        res.status(200).json({ 
            type : "success",
            message : "Check Your Email to Reset Your Password"
        })
    } catch (error) {
        if (error instanceof ValidationError) {
            return next({ 
                status : errorMiddleware.BAD_REQUEST_STATUS , 
                message : error?.errors?.[0] 
            })
        }
        next(error)
    }
}

export const resetPassword = async (req, res, next) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { password } = req.body;

        await validation.ResetPasswordValidationSchema.validate(req.body);

        const userExists = await User?.findOne(
            {
                where: 
                {
                    id : req.user.id
                }
            }
        );

        if (!userExists) throw ({ 
            status : errorMiddleware.BAD_REQUEST_STATUS, 
            message : errorMiddleware.USER_DOES_NOT_EXISTS 
        })

        const hashedPassword = encryption.hashPassword(password);

        await User?.update(
            { 
                password: hashedPassword
            }, 
            { 
                where: {
                    id: req.user.id
                }
            }
        );

        res.status(200).json({
            type : "success",
            message : "Reset Password Success, Please Login Again"
        })

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();

        if (error instanceof ValidationError) {
            return next({ 
                status : errorMiddleware.BAD_REQUEST_STATUS , 
                message : error?.errors?.[0] 
            })
        }

        next(error)
    }
}

export const registerUser = async (req, res, next) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { email, salary } = req.body;

        await validation.RegisterValidationSchema.validate(req.body);

        const userExists = await User?.findOne({ 
            where: { 
                email
            } 
        });

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

        const message  = handlebars.compile(template)({ link : `http://localhost:3000/active-account/${accessToken}` })

        const mailOptions = {
            from: config.GMAIL,
            to: email,
            subject: "Activate Your Account",
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

export const activateUser = async(req, res, next)=>{
    const transaction = await db.sequelize.transaction()
    try {
        const { email } = req.user

        await validation.ActivateUserValidationSchema.validate(req.body)

        await Object.assign(req.body,{
            password : encryption.hashPassword(req.body.password),
            status : 1
        })

        const user = await User?.update(
            req.body,
            {
                where: {
                    email
                }
            }
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
            where : {
                roleId : 2
            }
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