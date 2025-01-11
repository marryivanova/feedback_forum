// Модальное окно для регистрации
var modal = document.getElementById("signupModal");
var btn = document.getElementById("sign-up-btn");
var span = document.getElementsByClassName("close")[0];

// Открыть модальное окно
btn.onclick = function() {
    modal.style.display = "block";
}

// Закрыть модальное окно
span.onclick = function() {
    modal.style.display = "none";
}

// Закрыть модальное окно при клике вне области окна
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Обработка входа
document.getElementById('login-form').addEventListener('submit', async function(event) {
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
            localStorage.setItem('access_token', token);  // Сохранить токен
            window.location.href = "/v1/posts/welcome_page";  // Перенаправить на главную
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

// Обработка регистрации
document.getElementById('signup-form').addEventListener('submit', async function(event) {
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
            document.getElementById('signup-message').innerHTML = `
                <div class="success-message">
                    Account created successfully! Please log in.
                </div>
            `;
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
