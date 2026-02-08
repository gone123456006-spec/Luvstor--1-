const API_URL = 'http://localhost:5002/api';

async function runTest() {
    console.log('--- Starting Auth Reproduction Test (fetch) ---');

    try {
        // 1. Login Anonymously
        console.log('1. Attempting Anonymous Login...');
        const loginRes = await fetch(`${API_URL}/auth/anonymous`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'debug_user',
                country: 'US',
                gender: 'male'
            })
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            console.error('   > Login Failed:', loginRes.status, loginData);
            return;
        }

        const token = loginData.token;
        console.log('   > Login Successful. Token received:', token ? token.substring(0, 20) + '...' : 'NULL');

        if (!token) {
            console.error('   > FAILURE: No token received in login response.');
            return;
        }

        // 2. Access Protected Route
        console.log('2. Accessing Protected Route (auth/me)...');
        const meRes = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const meData = await meRes.json();

        if (meRes.ok) {
            console.log('   > Success! User data:', meData.user.username);
        } else {
            console.error('   > Protected Route Failed:', meRes.status);
            console.error('   > Server Error Message:', meData);
        }

    } catch (error) {
        console.error('Test Script Error:', error.message);
    }
}

runTest();
