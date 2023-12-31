import { ValidationError } from "yup"
import { User } from "../../models/all_models.js"
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
            shift : userExists?.dataValues?.shiftHourId,
            roleId : userExists?.dataValues?.roleId
        });
        
        delete userExists?.dataValues?.password;

        res.header("Authorization", `Bearer ${accessToken}`)
            .status(200)
            .json({ 
                type : "success",
                message : "Data berhasil dimuat",
                user : userExists 
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
                    id : req.user.id
                },
                attributes : {
                    exclude : ["password"]
                }
            }
        );

        res.status(200).json({ 
            type : "success",
            message : "Data berhasil dimuat",
            user : user
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

        const template = fs.readFileSync(path.join(process.cwd(), "templates", "resetPass.html"), "utf8");

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