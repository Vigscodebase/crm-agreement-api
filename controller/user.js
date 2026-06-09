import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../model/user.js";
import Role from "../model/role.js";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const userAccData = await User.findOne({ email });
        if (!userAccData) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // Compare password securely
        const isPasswordCorrect = await bcrypt.compare(password, userAccData.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // Generate Token: Contextually aligned to your 7.5-minute banking session lifespan
        const token = jwt.sign(
            { email: userAccData.email, role: userAccData.role },
            process.env.JWT_SECRET,
            { expiresIn: "7.5m" }
        );

        return res.status(200).json({
            token,
            message: "User logged in successfully"
        });

    } catch (error) {
        return res.status(500).json({ message: "An internal server error occurred." });
    }
};

export const signup = async (req, res) => {
    try {
        const { add_name, add_email, add_password, addrole_dropdown } = req.body;

        // SECURITY: Check existence BEFORE running CPU-heavy hashing functions
        const existingUser = await User.findOne({ email: add_email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }

        // Clean Async/Await hashing block
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(add_password, saltRounds);

        const newUser = new User({
            name: add_name,
            email: add_email,
            password: hashedPassword,
            role: addrole_dropdown,
        });

        // BUGFIX: Correctly awaiting document mapping persistence
        await newUser.save();

        return res.status(201).json({ success: "New user created successfully." });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const allUser = async (req, res) => {
    try {
        // Find non-deleted records matching boolean typing
        const listUsers = await User.find({ isDeleted: { $ne: true } });

        // PERFORMANCE FIX: Cache all roles to map locally, avoiding N+1 loops
        const roles = await Role.find({});
        const roleMap = new Map(roles.map(r => [r.role_slug, r.role_name]));

        const finalUsers = listUsers.map(item => ({
            id: item._id,
            email: item.email,
            name: item.name,
            image: item.image,
            role: roleMap.get(item.role) || item.role
        }));

        return res.status(200).json({
            data: finalUsers,
            message: "All users fetched successfully"
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getSingleUser = async (req, res) => {
    try {
        const { usr_email } = req.params; // Assumes param passes system identifier
        const singleUser = await User.findOne({ _id: usr_email });

        if (!singleUser) {
            return res.status(404).json({ message: "User profile not found." });
        }

        return res.status(200).json({
            data: singleUser,
            message: "Single user fetched successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateUsr = async (req, res) => {
    try {
        const { usr_ID } = req.params;
        const { superadmin_email } = req.body;

        const updateResult = await User.updateOne(
            { _id: usr_ID },
            {
                $set: {
                    isDeleted: true,
                    deletedBy: superadmin_email,
                }
            }
        );

        if (!updateResult.acknowledged || updateResult.matchedCount === 0) {
            return res.status(400).json({ message: "Something went wrong or user context missing." });
        }

        return res.status(200).json({ message: "User deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const editUsr = async (req, res) => {
    try {
        const { usr_ID } = req.params;
        const { edit_name, edit_email, editrole_dropdown, edit_password } = req.body;

        const updateFields = {
            email: edit_email,
            name: edit_name,
            role: editrole_dropdown,
        };

        // Streamlined evaluation instead of repeating heavy code blocks
        if (edit_password && edit_password.trim().length > 0) {
            const saltRounds = 10;
            updateFields.password = await bcrypt.hash(edit_password, saltRounds);
        }

        const editResult = await User.updateOne({ _id: usr_ID }, { $set: updateFields });

        if (!editResult.acknowledged || editResult.matchedCount === 0) {
            return res.status(400).json({ message: "Update operation rejected or targets missing." });
        }

        return res.status(200).json({ message: "Updated user successfully" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};