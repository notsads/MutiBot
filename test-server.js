const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:10000';

async function testEndpoint(endpoint, description) {
    try {
        console.log(`🔍 Testing ${description}...`);
        const response = await fetch(`${BASE_URL}${endpoint}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${description} - Status: ${response.status}`);
            console.log(`   Data:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
        } else {
            console.log(`❌ ${description} - Status: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ ${description} - Error: ${error.message}`);
    }
    console.log('');
}

async function testServer() {
    console.log('🚀 Testing Lanya Web Server...\n');
    
    // Test health endpoint
    await testEndpoint('/api/health', 'Health Check');
    
    // Test stats endpoint
    await testEndpoint('/api/stats', 'Bot Statistics');
    
    // Test commands endpoint
    await testEndpoint('/api/commands', 'Commands List');
    
    // Test servers endpoint
    await testEndpoint('/api/servers', 'Servers List');
    
    // Test analytics endpoint
    await testEndpoint('/api/analytics', 'Analytics Data');
    
    // Test bot info endpoint
    await testEndpoint('/api/botinfo', 'Bot Information');
    
    // Test status endpoint
    await testEndpoint('/api/status', 'System Status');
    
    // Test main page
    try {
        console.log('🔍 Testing Main Page...');
        const response = await fetch(`${BASE_URL}/`);
        
        if (response.ok) {
            console.log('✅ Main Page - Status: 200 OK');
            console.log('   Content-Type:', response.headers.get('content-type'));
        } else {
            console.log(`❌ Main Page - Status: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Main Page - Error: ${error.message}`);
    }
    
    console.log('\n🎉 Server testing complete!');
    console.log('📊 Dashboard should be available at: http://localhost:10000');
}

// Run the test
testServer().catch(console.error); 