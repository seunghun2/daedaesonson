const fs = require('fs');
const { JWT } = require('google-auth-library');
const path = require('path');

async function main() {
    const creds = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
    const jwt = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    try {
        console.log("Attempting to authorize...");
        const tokens = await jwt.authorize();
        console.log("Success! Token obtained.");
        // console.log(tokens);
    } catch (e) {
        console.error("Auth Failed:", e);
    }
}
main();
