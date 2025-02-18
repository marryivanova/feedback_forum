// Локальное состояние для хранения комментариев
const commentsState = {}; // { postId: [комментарии] }

document.addEventListener('DOMContentLoaded', function () {
    fetchPosts();
});

// Функция для загрузки постов
async function fetchPosts() {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Необходимо авторизоваться');
        }

        const response = await fetch('http://127.0.0.1:8000/v1/posts/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const posts = await response.json();

        // Отображение постов и загрузка комментариев
        const feedbackList = document.getElementById('feedback-list');
        feedbackList.innerHTML = ''; // Очищаем список перед добавлением новых данных
        posts.forEach(postData => {
            const post = postData.Post;
            const postElement = createPostElement(post);
            feedbackList.appendChild(postElement);

            // Загружаем комментарии для каждого поста
            fetchComments(post.id, postElement);
        });
    } catch (error) {
        console.error('Ошибка при загрузке постов:', error);
        alert('Не удалось загрузить посты. Проверьте подключение к интернету или авторизацию.');
    }
}

// Функция для создания HTML элемента отзыва
function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.classList.add('feedback-item', 'row', 'mb-4');
    postElement.dataset.postId = post.id; // Добавляем ID поста для дальнейшего использования

    // Проверяем, есть ли изображение в посте
    const imageHtml = post.image_data
        ? `<div class="col-12">
              <img src="http://127.0.0.1:8000/v1/posts/posts/${post.id}/image" alt="Post Image" class="img-fluid" loading="lazy" onerror="this.style.display='none'">
           </div>`
        : '';

    postElement.innerHTML = `
        <div class="col-12">
            <h3>${post.title}</h3>
            <p><strong>Type:</strong> ${post.type}</p>
            <p>${post.content}</p>
        </div>
        ${imageHtml}
        <div class="col-md-6 d-flex justify-content-start">
            <button class="vote-button btn btn-primary" onclick="vote(this, 'positive')">👍 <span class="vote-count">0</span></button>
            <button class="vote-button btn btn-danger ms-2" onclick="vote(this, 'negative')">👎 <span class="negative-count">0</span></button>
        </div>
        <div class="col-md-6 text-end">
            <button class="leave-comment-button btn btn-info" onclick="toggleCommentForm(this)">Leave a Comment</button>
        </div>
        <!-- Комментарии -->
        <div class="comment-section">
            <h4>Comments:</h4>
            <div class="comment-content"></div>
            <span>Show Comments</span>
        </div>
        <div class="comment-form" style="display: none;">
            <input type="text" placeholder="Your Name" required>
            <textarea rows="2" placeholder="Your comment..." required></textarea>
            <button onclick="addComment(this)">Add Comment</button>
        </div>
    `;
    return postElement;
}

// Функция для загрузки комментариев
async function fetchComments(postId, feedbackItem) {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Необходимо авторизоваться');
        }

        const response = await fetch(`http://127.0.0.1:8000/v1/posts/${postId}/comments`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const comments = await response.json();

        // Сохраняем комментарии в локальное состояние
        commentsState[postId] = comments;

        // Отображаем комментарии
        renderComments(postId, feedbackItem);
    } catch (error) {
        console.error('Ошибка при загрузке комментариев:', error);
        alert('Не удалось загрузить комментарии. Попробуйте снова.');
    }
}

// Функция для отображения комментариев
function renderComments(postId, feedbackItem) {
    const commentContent = feedbackItem.querySelector('.comment-content');
    commentContent.innerHTML = ''; // Очищаем текущие комментарии

    // Получаем комментарии из локального состояния
    const comments = commentsState[postId] || [];

    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.classList.add('comment');
        commentElement.dataset.commentId = comment.id; // Сохраняем comment_id
        commentElement.innerHTML = `
            <strong>${comment.user_id}</strong>: ${comment.content}
            <div class="comment-actions">
                <button class="delete-btn" onclick="deleteComment(this)">Delete</button>
            </div>
        `;
        commentContent.appendChild(commentElement);
    });
}

// Удаление комментария
async function deleteComment(button) {
    const isConfirmed = confirm('Вы уверены, что хотите удалить этот комментарий?');
    if (!isConfirmed) {
        return; // Отменяем удаление, если пользователь не подтвердил
    }

    const comment = button.closest('.comment');
    const feedbackItem = button.closest('.feedback-item');
    const postId = feedbackItem.dataset.postId; // Получаем post_id
    const commentId = comment.dataset.commentId; // Получаем comment_id

    // Проверяем, что post_id и comment_id существуют
    if (!postId || !commentId) {
        console.error('post_id или comment_id не найдены');
        alert('Ошибка: post_id или comment_id не найдены');
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Необходимо авторизоваться');
        }

        // Отправляем запрос на удаление комментария
        const response = await fetch(`http://127.0.0.1:8000/v1/posts/${postId}/comments?comment_id=${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        // Удаляем комментарий из локального состояния
        commentsState[postId] = commentsState[postId].filter(c => c.id !== parseInt(commentId));

        // Перерисовываем комментарии
        renderComments(postId, feedbackItem);
    } catch (error) {
        console.error('Ошибка при удалении комментария:', error);
        alert('Не удалось удалить комментарий. Попробуйте снова.');
    }
}

// Добавить комментарий
async function addComment(button) {
    const feedbackItem = button.closest('.feedback-item');
    const name = feedbackItem.querySelector('.comment-form input').value;
    const commentText = feedbackItem.querySelector('.comment-form textarea').value;

    if (name && commentText) {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('Необходимо авторизоваться');
            }

            // Показываем индикатор загрузки
            button.disabled = true;
            button.textContent = 'Отправка...';

            const postId = feedbackItem.dataset.postId;
            const response = await fetch(`http://127.0.0.1:8000/v1/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: commentText
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const newComment = await response.json();

            // Добавляем новый комментарий в локальное состояние
            if (!commentsState[postId]) {
                commentsState[postId] = [];
            }
            commentsState[postId].push(newComment);

            // Перерисовываем комментарии
            renderComments(postId, feedbackItem);

            // Очистить форму
            feedbackItem.querySelector('.comment-form input').value = '';
            feedbackItem.querySelector('.comment-form textarea').value = '';
        } catch (error) {
            console.error('Ошибка при добавлении комментария:', error);
            alert('Не удалось добавить комментарий. Попробуйте снова.');
        } finally {
            // Восстанавливаем кнопку
            button.disabled = false;
            button.textContent = 'Add Comment';
        }
    }
}

// Функция для отображения/скрытия формы комментариев
function toggleCommentForm(button) {
    const form = button.closest('.feedback-item').querySelector('.comment-form');
    form.style.display = form.style.display === 'block' ? 'none' : 'block';
}

// Редактирование комментария
function editComment(button) {
    const comment = button.closest('.comment');
    const commentText = comment.querySelector('strong').nextSibling.textContent.trim();
    const feedbackItem = button.closest('.feedback-item');

    const form = feedbackItem.querySelector('.comment-form');
    form.querySelector('textarea').value = commentText;

    // Удаляем текущий комментарий
    comment.remove();

    // Добавляем флаг редактирования
    form.querySelector('button').textContent = 'Save Changes';
}

// Голосование за комментарий
async function vote(button, type) {
    const feedbackItem = button.closest('.feedback-item');
    const voteCountElement = feedbackItem.querySelector('.vote-count');
    const negativeCountElement = feedbackItem.querySelector('.negative-count');
    const positiveButton = feedbackItem.querySelector('.btn-primary');
    const negativeButton = feedbackItem.querySelector('.btn-danger');

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Необходимо авторизоваться');
        }

        // Определяем direction: 1 для "positive", -1 для "negative"
        const direction = type === 'positive' ? 1 : -1;

        // Проверяем, был ли уже голос
        const hasVotedPositive = positiveButton.classList.contains('voted');
        const hasVotedNegative = negativeButton.classList.contains('voted');

        // Если пользователь нажимает на уже выбранную кнопку, отменяем голос
        if ((type === 'positive' && hasVotedPositive) || (type === 'negative' && hasVotedNegative)) {
            direction = 0; // Отмена голоса
        }

        const response = await fetch('http://127.0.0.1:8000/v1/vote/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                post_id: parseInt(feedbackItem.dataset.postId), // ID поста
                direction: direction // Направление голоса
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const result = await response.json();

        // Обновляем счетчики голосов на основе ответа сервера
        if (result.positive_votes !== undefined && result.negative_votes !== undefined) {
            voteCountElement.textContent = result.positive_votes;
            negativeCountElement.textContent = result.negative_votes;
        }

        // Обновляем стили кнопок
        if (type === 'positive') {
            positiveButton.classList.toggle('voted');
            positiveButton.style.backgroundColor = positiveButton.classList.contains('voted') ? '#b6d7a8' : '';
            positiveButton.style.color = positiveButton.classList.contains('voted') ? 'white' : '';

            // Если голосуем "за", снимаем голос "против"
            if (direction === 1 && negativeButton.classList.contains('voted')) {
                negativeButton.classList.remove('voted');
                negativeButton.style.backgroundColor = '';
                negativeButton.style.color = '';
            }
        } else {
            negativeButton.classList.toggle('voted');
            negativeButton.style.backgroundColor = negativeButton.classList.contains('voted') ? '#ead1dc' : '';
            negativeButton.style.color = negativeButton.classList.contains('voted') ? 'white' : '';

            // Если голосуем "против", снимаем голос "за"
            if (direction === -1 && positiveButton.classList.contains('voted')) {
                positiveButton.classList.remove('voted');
                positiveButton.style.backgroundColor = '';
                positiveButton.style.color = '';
            }
        }
    } catch (error) {
        console.error('Ошибка при голосовании:', error);
        alert('Не удалось проголосовать. Попробуйте снова.');
    }
}