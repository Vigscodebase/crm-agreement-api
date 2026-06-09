import Role from "../model/role.js";

export const fetchrole = async (req, res) => {
    try {
        const list_roles = await Role.find({});

        // BUGFIX: Standardizes response handling context. 
        // 204 responses explicitly prohibit standard text body content transmission.
        if (!list_roles || list_roles.length === 0) {
            return res.status(200).json({
                data: [],
                message: "No roles found within system databases."
            });
        }

        return res.status(200).json({
            data: list_roles,
            message: "All roles fetched successfully"
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};