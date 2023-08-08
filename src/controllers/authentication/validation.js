import * as Yup from "yup"
import YupPassword from 'yup-password';
YupPassword(Yup);

export const LoginValidationSchema = Yup.object({
    username : Yup.string().required("Username is required"),
    password : Yup.string().required("Password is required")
})

export const EmailValidationSchema = Yup.object({
    email : Yup.string()
        .email("Invalid email")
        .required("Email is required")
})

export const ResetPasswordValidationSchema = Yup.object({
    password : Yup.string()
        .required("Password is required")
        .min(8, "Password must contain 8 or more characters with at least one of each: uppercase, special character and number")
        .minUppercase(1, "Password must contain at least 1 upper case letter")
        .minSymbols(1, "Password must contain at least 1 special character")
        .minNumbers(1,"Password must contain at least 1 number"),
    confirm: Yup.string()
        .required("Password is required")
        .oneOf([Yup.ref('password'), null], 'Must match "password" field value'),
});