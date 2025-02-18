// Обработчик клика на кнопку отправки формы
document.getElementById('submit-btn').addEventListener('click', function (event) {
    event.preventDefault();  // Останавливаем стандартное поведение кнопки

    // Получаем форму и создаем объект FormData для отправки данных
    const form = document.getElementById('feedback-form');
    const formData = new FormData(form);

    // Получаем токен из localStorage (или другого хранилища)
    const token = localStorage.getItem('access_token');
    console.log("Token from localStorage:", token);

    if (!token) {
        alert('Authentication token is missing!');
        return;
    }

    // Проверяем состояние
    const isPublished = document.getElementById('notifications').checked;

    // Извлекаем нужные данные для отправки на сервер
    const name = form.querySelector('input[name="name"]').value;
    const feedback = form.querySelector('textarea[name="feedback"]').value;
    const feedbackType = form.querySelector('select[name="feedback_type"]').value;
    const imageFile = form.querySelector('input[name="screenshot"]').files[0];

    // Добавляем в FormData дополнительные поля, включая поля для title, content, и type
    formData.append('title', name);  // Используем имя пользователя для title
    formData.append('content', feedback);  // Используем текст отзыва для content
    formData.append('published', isPublished);  // Устанавливаем значение поля published из переключателя
    formData.append('type', feedbackType === 'feature_suggestion' ? 'feature' : 'bug');  // Устанавливаем тип отзыва

    // Если файл выбран, добавляем его в данные
    if (imageFile) {
        formData.append('image', imageFile);
    }

    // Отправляем данные на сервер через AJAX
    $.ajax({
        url: 'http://localhost:8000/v1/posts/',  // Убедитесь, что этот адрес правильный
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function (response) {
            alert('Feedback submitted successfully!');
            console.log('Success response:', response);

            // Перенаправление на страницу благодарности после успешной отправки
            window.location.href = '/v1/posts/thank-you';
        },
        error: function (xhr, status, error) {
            alert('Error submitting feedback!');
            console.log('XHR:', xhr);
            console.log('Status:', status);
            console.log('Error:', error);
        }
    });
});

// Перенаправление на страницу форума при клике на кнопку
document.getElementById('redirect-btn').addEventListener('click', function (event) {
    event.preventDefault();  // Останавливаем стандартное поведение (переход по ссылке)

    // Перенаправляем на нужную страницу
    window.location.href = "/v1/vote/feedback/forum";  // Перенаправляем на страницу форума
});