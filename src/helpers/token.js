import jwt from "jsonwebtoken"

export const createToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY)
}

export const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET_KEY)
}