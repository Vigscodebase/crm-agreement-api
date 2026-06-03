import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Template from './model/template.js'; // Ensure file extension is correct for ES modules

// Load environment variables
dotenv.config();

const templates = [
    {
        name: 'Monthly SEO Service',
        serviceType: 'SEO',
        description: 'Complete SEO optimization package',
        templateHtml: '<h1>Monthly SEO Service Agreement</h1><p>{{defaultScope}}</p>',
        defaultScope: 'Keyword research, on-page optimization, link building, monthly reporting',
        defaultPricing: { monthlyFee: 2000, setupFee: 500, currency: 'USD' },
        defaultTerms: 'Services are provided on a monthly basis. Minimum 3-month commitment required.',
        variables: [
            { key: 'clientName', label: 'Client Name', type: 'text', required: true },
            { key: 'monthlyFee', label: 'Monthly Fee', type: 'number', required: true },
        ],
    },
    {
        name: 'Google Ads Management',
        serviceType: 'Google Ads',
        description: 'PPC campaign management',
        templateHtml: '<h1>Google Ads Management Agreement</h1><p>{{defaultScope}}</p>',
        defaultScope: 'Campaign setup, daily optimization, bid management, monthly reporting',
        defaultPricing: { monthlyFee: 1500, setupFee: 300, currency: 'USD' },
        defaultTerms: 'Ads management with monthly optimization reports.',
        variables: [],
    },
    {
        name: 'Meta Ads Management',
        serviceType: 'Meta Ads',
        description: 'Facebook & Instagram ads',
        templateHtml: '<h1>Meta Ads Management Agreement</h1><p>{{defaultScope}}</p>',
        defaultScope: 'Campaign creation, audience targeting, daily optimization, analytics',
        defaultPricing: { monthlyFee: 1200, setupFee: 200, currency: 'USD' },
        defaultTerms: 'Management of Meta advertising accounts.',
        variables: [],
    },
    {
        name: 'Social Media Management',
        serviceType: 'Social Media',
        description: 'Content creation and posting',
        templateHtml: '<h1>Social Media Management Agreement</h1><p>{{defaultScope}}</p>',
        defaultScope: 'Daily posting, community management, content creation, analytics',
        defaultPricing: { monthlyFee: 1000, setupFee: 0, currency: 'USD' },
        defaultTerms: 'Monthly social media management service.',
        variables: [],
    },
];

async function seedDatabase() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI missing from environment variables.");
        }

        console.log('Connecting to Clickmatix Agreement CRM Database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Database connected successfully.');

        console.log(`Seeding ${templates.length} templates...`);

        for (const tmpl of templates) {
            // Re-mapping clean, standard JavaScript objects
            const sanitizedVariables = Array.isArray(tmpl.variables)
                ? tmpl.variables.map(v => ({
                    key: String(v.key),
                    label: String(v.label),
                    type: String(v.type),
                    required: Boolean(v.required)
                }))
                : [];

            await Template.updateOne(
                { name: tmpl.name },
                {
                    $set: {
                        name: tmpl.name,
                        serviceType: tmpl.serviceType,
                        description: tmpl.description,
                        templateHtml: tmpl.templateHtml,
                        defaultScope: tmpl.defaultScope,
                        defaultPricing: tmpl.defaultPricing,
                        defaultTerms: tmpl.defaultTerms,
                        variables: sanitizedVariables, // Passing explicitly processed clean array
                        updatedAt: new Date()
                    },
                    $setOnInsert: {
                        createdAt: new Date(),
                        isActive: true
                    }
                },
                { upsert: true }
            );
        }

        console.log('✅ Base templates seeded/updated successfully.');
    } catch (error) {
        console.error('❌ Seeding process failed:', error.message);
    } finally {
        // ALWAYS close connections in isolated scripts
        await mongoose.connection.close();
        console.log('Database connection closed.');
        process.exit(0);
    }
}

seedDatabase();