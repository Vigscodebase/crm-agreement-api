export const getFrontendLog = async (req, res) => {
    try {
        const { message, level, timestamp } = req.body;

        // Safely write frontend logs into the dedicated file
        frontendFileLogger.info({
            clientTimestamp: timestamp,
            clientLevel: level,
            msg: message,
            ip: req.ip
        });

        res.status(200).json({ status: 'logged' });
    } catch (error) {
        console.error('Agreement Processing Exception:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

export const getAgreementDetails = async (req, res) => {
    try {
        const { agreement_id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(agreement_id)) {
            return res.status(400).json({ error: 'Invalid identifier format requested.' });
        }

        const agreement = await AgreementModel.findById(agreement_id);

        if (!agreement) {
            return res.status(404).json({ error: 'Agreement lookup returned no records.' });
        }

        return res.status(200).json({ agreement });
    } catch (error) {
        console.error('Agreement Fetch Exception:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};