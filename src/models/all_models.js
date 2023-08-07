import db from "./index.js";

export const Attendances = db.sequelize.define("attendances", {
    id: {
        type: db.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    userId: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    date: {
        type: db.Sequelize.DATEONLY,
        allowNull: false
    },
    clock_in: {
        type: db.Sequelize.TIME,
        allowNull: true
    },
    clock_out: {
        type: db.Sequelize.TIME,
        allowNull: true
    },
    salary: {
        type : db.Sequelize.STRING,
        allowNull : false
    }  
},
{ timestamps: true }
);

export const Role = db.sequelize.define("roles",{
    id: {
        type: db.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    name: {
        type: db.Sequelize.STRING(45),
        allowNull: false
    }
},
{ timestamps: false }
)

export const Salaries = db.sequelize.define("salaries",{
    id: {
        type: db.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    userId: {
        type: db.Sequelize.INTEGER,
        allowNull : false
    },
    salary: {
        type: db.Sequelize.STRING,
        allowNull : false
    }
},
{ timestamps: false }
)

export const Shift = db.sequelize.define("shift_hours",{
    id: {
        type: db.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    start:{
        type: db.Sequelize.TIME,
        allowNull: false
    },
    end:{
        type: db.Sequelize.TIME,
        allowNull: false
    }
},
{timestamps: false}
)

export const User = db.sequelize.define("users", {
    id: {
        type: db.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    username: {
        type: db.Sequelize.STRING(45),
        allowNull: true
    },
    email: {
        type : db.Sequelize.STRING(45),
        allowNull : false
    },
    password: {
        type: db.Sequelize.TEXT('long'),
        allowNull : true
    },
    dob: {
        type: db.Sequelize.DATE,
        allowNull : true
    },
    gender: {
        type: db.Sequelize.STRING(45),
        allowNull: false
    },
    phone: {
        type: db.Sequelize.STRING(15),
        allowNull: true
    },
    roleId: {
        type: db.Sequelize.INTEGER,
        allowNull : false,
    },
    shiftHourId: {
        type: db.Sequelize.INTEGER,
        allowNull : false,
    },
    status: {
        type: db.Sequelize.INTEGER,
        allowNull : false,
        defaultValue: 0
    },
},
{ timestamps: false }
)
Salaries.belongsTo(User, {foreignKey: 'userId'})

User.hasMany(Attendances);
User.hasOne(Salaries);
User.belongsTo(Role, {foreignKey : 'roleId'});
User.belongsTo(Shift, {foreignKey: 'shiftHourId'});

Attendances.belongsTo(User, {foreignKey : 'userId'});

Role.hasMany(User);

Shift.hasMany(User);
