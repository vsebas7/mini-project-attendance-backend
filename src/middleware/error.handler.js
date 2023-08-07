export const SOMETHING_WENT_WRONG = "Something went wrong";
export const UNAUTHORIZED = "Unauthorized";
export const USER_NOT_FOUND = "User not found";
export const EMAIL_NOT_FOUND = "Email not found";
export const USER_ALREADY_EXISTS = "User already exists";
export const USERNAME_ALREADY_EXISTS = "Username is already taken";
export const EMAIL_ALREADY_EXISTS = "Email address is already taken";
export const INCORRECT_PASSWORD = "Password is incorrect";
export const INVALID_CREDENTIALS = "Invalid credentials";
export const BAD_REQUEST = "Bad request";

export const CLOCK_IN_ALREADY_EXISTS = "User already clock in"
export const CLOCK_IN_NOT_FOUND = "User did not clock in before"
export const CLOCK_IN_NOT_YET_OPEN = "User can clock in at least 30 minutes before shift time"
export const CLOCK_IN_CLOSED = "Clock in time already exceed shift time"

export const CLOCK_OUT_ALREADY_EXISTS = "User already clock out"
export const CLOCK_OUT_NOT_YET_OPEN = "Your shift has not end yet"
export const CLOCK_OUT_CLOSED = "Clock out time already exceed tolerated shift end"


export const DATA_NOT_FOUND = "Data not found"

export const DEFAULT_ERROR_STATUS = 500;
export const BAD_REQUEST_STATUS = 400;
export const UNAUTHORIZED_STATUS = 401;
export const NOT_FOUND_STATUS = 404;

export default function errorHandler (error, req, res, next) {
    if (error?.name === "SequelizeValidationError") {
        return res.status(BAD_REQUEST_STATUS)
            .json(
                { message : error?.errors?.[0]?.message }
            )
    }

    const message = error?.message || SOMETHING_WENT_WRONG;
    const status = error?.status || DEFAULT_ERROR_STATUS;
    res.status(status).json({ 
        type : "error", 
        status, 
        message
    });
}