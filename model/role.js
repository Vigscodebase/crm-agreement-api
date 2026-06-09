import mongoose from "mongoose";

const roleschema = new mongoose.Schema({
    role_slug: {
        type: String,
        required: true,
        unique: true,
        enum: ['super_admin', 'admin', 'sales_manager', 'account_manager'],
    },
    role_name: {
        type: String,
        required: true,
    },
},
{
    timestamps: {
        createdAt: "created",
        updatedAt: "updated"
    }
});

export default mongoose.model("Role", roleschema);