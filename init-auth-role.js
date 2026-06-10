import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Role from "./model/role.js";
import User from "./model/user.js";

const SALT_ROUNDS = 10;

async function initializeAuthRoleDatabase() {
    try {
        // Use environment variable with local fallback for 2024-2026 containerization standards
        const dbUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/clickmatixagreements";
        await mongoose.connect(dbUri);
        console.log("✅ Connected to MongoDB");

        // ==========================================
        // 1. SEED SYSTEM ROLES (Idempotent Bulk Write)
        // ==========================================
        const targetRoles = [
            { role_slug: "super_admin", role_name: "Super Admin" },
            { role_slug: "admin", role_name: "Admin" },
            { role_slug: "sales_manager", role_name: "Sales Manager" },
            { role_slug: "account_manager", role_name: "Account Manager" }
        ];

        // Perform bulk write ONCE outside any loops for optimal database performance
        const roleOperations = targetRoles.map(role => ({
            updateOne: {
                filter: { role_slug: role.role_slug },
                update: { $set: { role_name: role.role_name } },
                upsert: true
            }
        }));

        await Role.bulkWrite(roleOperations);
        console.log("✅ System roles initialization complete");


        // ==========================================
        // 2. SEED SUPER ADMIN USER (Secure Upsert)
        // ==========================================
        const adminEmail = "sanket@clickmatix.com";
        const rawPassword = "SuperAdmin@372";
        const adminName = "Sanket Patel";
        const adminRole = "super_admin";

        // Hash password securely using async/await path
        const hashedPassword = await bcrypt.hash(rawPassword, SALT_ROUNDS);

        // Check if user already exists to preserve modifications or handle upsert safely
        const userPayload = {
            name: adminName,
            email: adminEmail.trim().toLowerCase(),
            password: hashedPassword,
            role: adminRole,
            isDeleted: false
        };

        await User.updateOne(
            { email: userPayload.email },
            { $set: userPayload },
            { upsert: true }
        );

        console.log("✅ Super Admin seed synchronized successfully");
        console.log(`Name: ${adminName}`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: [SECURELY HASHED]`);


        // ==========================================
        // CLEANUP
        // ==========================================
        await mongoose.connection.close();
        console.log("✅ Auth database seed completed successfully.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Database Initialization Failed:", error.message);
        process.exit(1);
    }
}

// Fire initialization process
initializeAuthRoleDatabase();