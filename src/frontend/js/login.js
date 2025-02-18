// Check if the user is already logged in by checking if there's a token in localStorage
if (localStorage.getItem('access_token')) {
    window.location.href = "/v1/posts/welcome_page"; // Redirect to welcome page if already logged in
}

// Get modal and button for signup
var modal = document.getElementById("signupModal");
var btn = document.getElementById("sign-up-btn");
var span = document.getElementsByClassName("close")[0];

// Open the modal when clicking the "Sign up" link
btn.onclick = function () {
    modal.style.display = "block";
}

// Close the modal when clicking the <span> (x) element
span.onclick = function () {
    modal.style.display = "none";
}

// Close the modal when clicking anywhere outside of the modal
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Send login request
document.getElementById('login-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const data = new URLSearchParams();
    data.append('username', username);
    data.append('password', password);

    try {
        const response = await fetch('http://localhost:8000/v1/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: data
        });

        const result = await response.json();

        if (response.ok) {
            const token = result.access_token;
            localStorage.setItem('access_token', token);  // Save token to localStorage
            console.log('Token saved:', token);  // Log the token
            window.location.href = "/v1/posts/welcome_page";  // Redirect to welcome page
        } else {
            document.getElementById('message').innerHTML = `
                <div class="error-message">
                    ${result.detail || 'Invalid credentials. Please try again.'}
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('message').innerHTML = `
            <div class="error-message">
                An error occurred. Please try again later.
            </div>
        `;
        console.error('Error during login:', error);
    }
});

// Send signup request
document.getElementById('signup-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const userData = { email, password };

    try {
        const response = await fetch('http://localhost:8000/v1/users/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (response.ok) {
            const token = result.access_token;
            localStorage.setItem('access_token', token);  // Save token to localStorage
            window.location.href = "/v1/posts/welcome_page";  // Redirect to welcome page
        } else {
            document.getElementById('signup-message').innerHTML = `
                <div class="error-message">
                    ${result.detail || 'Error creating account.'}
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('signup-message').innerHTML = `
            <div class="error-message">
                An error occurred. Please try again later.
            </div>
        `;
        console.error('Error during signup:', error);
    }
});