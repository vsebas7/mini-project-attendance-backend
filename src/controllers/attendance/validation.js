import moment from "moment";
import * as Yup from "yup"

export const ClockInValidationSchema = Yup.object({
    date : Yup.string()
        .required("Date is required")
        .matches(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/,"Date is invalid"),
    clock_in : Yup.string()
        .required("Clock in time is required")
        .matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,"Clock in time is invalid")
})

export const ClockOutValidationSchema = Yup.object({
    date : Yup.string()
        .required("Date is required")
        .matches(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/,"Date is invalid"),
    clock_out : Yup.string()
        .required("Clock in time is required")
        .matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,"Clock in time is invalid")
})