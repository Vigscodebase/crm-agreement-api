import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        default: ''
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'sales_manager', 'account_manager', 'client'],
        required: true // Removed the invalid 'user' default to preserve enum integrity
    },
    image: {
        type: String,
        trim: true,
        default: ''
    },
    // Added keys utilized within your controller operations
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedBy: {
        type: String,
        default: null
    }
},
{
    timestamps: {
        createdAt: "created",
        updatedAt: "updated"
    }
});

export default mongoose.model("User", userSchema);