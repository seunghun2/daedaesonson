require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
const facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

// The specific parks we recently updated using the Node scripts (which bypassed the Admin API).
const parksToResync = [
    'park-0017', 'park-0018', 'park-0019', 'park-0020', 'park-0021',
    'park-0022', 'park-0023', 'park-0024', 'park-0025'
];

async function resyncViaApi() {
    console.log('Sending updated facilities to Admin API...');

    const payload = facilitiesData.filter(f => parksToResync.includes(f.id));
    if (payload.length === 0) {
        console.log('No matching facilities found in data/facilities.json.');
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const txt = await res.text();
            console.error('API Error Response:', txt);
        } else {
            const result = await res.json();
            console.log('Successfully synced via Admin API:', result);
        }
    } catch (e) {
        console.error('Failed to connect to API. Make sure dev server is running on port 3000.', e);
    }
}

resyncViaApi();
