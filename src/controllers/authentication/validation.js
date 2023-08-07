import * as Yup from "yup"
import YupPassword from 'yup-password';
YupPassword(Yup);

export const RegisterValidationSchema = Yup.object({
    email : Yup.string()
        .email("Invalid email")
        .required("Email is required"),

    roleId : Yup.string()
        .required("User's role is required"),

    shiftHourId : Yup.string()
        .required("User's shift is required"),

    gender : Yup.string()
        .matches("(?:m|M|male|Male|f|F|female|Female|FEMALE|MALE|)$")
        .required("User's gender is required")
})

export const LoginValidationSchema = Yup.object({
    username : Yup.string().required("Username is required"),
    password : Yup.string().required("Password is required")
})

export const EmailValidationSchema = Yup.object({
    email : Yup.string().email("Invalid email").required("Email is required")
})

export const ChangePasswordSchema = Yup.object({
    currentPassword: Yup.string().required("Password is required"),
    newPassword: Yup.string()
        .required("Password is required")
        .notOneOf([Yup.ref('currentPassword')],"New and Current Password can't be the same")
        .min(6, "Password must contain 6 or more characters with at least one of each: uppercase, special character and number")
        .minUppercase(1, "Password must contain at least 1 upper case letter")
        .minSymbols(1, "Password must contain at least 1 special character")
        .minNumbers(1,"Password must contain at least 1 number"),
    confirmPassword: Yup.string()
        .required("Password is required")
        .oneOf([Yup.ref('newPassword'), null], 'Must match "New Password" field value'),
});

export const ResetPasswordValidationSchema = Yup.object({
    password : Yup.string()
        .required("Password is required")
        .min(6, "Password must contain 6 or more characters with at least one of each: uppercase, special character and number")
        .minUppercase(1, "Password must contain at least 1 upper case letter")
        .minSymbols(1, "Password must contain at least 1 special character")
        .minNumbers(1,"Password must contain at least 1 number"),
    confirm: Yup.string()
        .required("Password is required")
        .oneOf([Yup.ref('password'), null], 'Must match "password" field value'),
});

export const ActivateUserValidationSchema = Yup.object({
    username : Yup.string()
        .required("Username is required")
        .min(5,"Username must contain 6 or more characters"),
    password: Yup.string()
        .required("Password is required")
        .notOneOf([Yup.ref('currentPassword')],"New and Current Password can't be the same")
        .min(8, "Password must contain 6 or more characters with at least one of each: uppercase, special character and number")
        .minUppercase(1, "Password must contain at least 1 upper case letter")
        .minSymbols(1, "Password must contain at least 1 special character")
        .minNumbers(1,"Password must contain at least 1 number"),
    dob : Yup.date()
        .nullable(),
    phone : Yup.string()
        .matches(/[0-9]/,"phone must be a number")
        .min(10,"phone must contain 10 or more digits")
        .required("Phone number is required"),
})