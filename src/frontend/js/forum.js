// Local state for storing comments
const commentsState = {}; // { postId: [comments] }

document.addEventListener('DOMContentLoaded', function () {
    fetchPosts();
});

// Function to fetch posts
async function fetchPosts() {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Authorization required');
        }

        const response = await fetch('http://127.0.0.1:8000/v1/posts/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const posts = await response.json();

        // Display posts and fetch comments
        const feedbackList = document.getElementById('feedback-list');
        feedbackList.innerHTML = ''; // Clear the list before adding new data
        posts.forEach(postData => {
            const post = postData.Post;
            const votes = postData.votes; // Get the number of votes
            const postElement = createPostElement(post, votes); // Pass votes to the function
            feedbackList.appendChild(postElement);

            // Fetch comments for each post
            fetchComments(post.id, postElement);
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        alert('Failed to fetch posts. Check your internet connection or authorization.');
    }
}

// Функция для обработки голосования
async function handleVote(postId, buttonElement) {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Authorization required');
        }

        const voteCountElement = buttonElement.querySelector('.vote-count');
        const currentVotes = parseInt(voteCountElement.textContent);
        const direction = buttonElement.classList.contains('voted') ? 0 : 1;

        const response = await fetch('http://127.0.0.1:8000/v1/vote/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                post_id: postId,
                direction: direction
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const result = await response.json();

        if (result.positive_votes !== undefined) {
            voteCountElement.textContent = result.positive_votes;
        }

        if (direction === 1) {
            buttonElement.classList.add('voted');
            buttonElement.style.backgroundColor = '#b6d7a8'; //
            buttonElement.style.color = 'white'; //
        } else {
            buttonElement.classList.remove('voted');
            buttonElement.style.backgroundColor = ''; //
            buttonElement.style.color = ''; //
        }
    } catch (error) {
        console.error('Error voting:', error);
        alert('Failed to vote. Please try again.');
    }
}

// Function to create an HTML element for a post
function createPostElement(post, votes) {
    const postElement = document.createElement('div');
    postElement.classList.add('feedback-item', 'row', 'mb-4');
    postElement.dataset.postId = post.id;

    // Create HTML for the image if the image URL exists
    let imageHtml = '';
    if (post.image_url) {
        imageHtml = `
            <div class="col-12">
                <img src="http://127.0.0.1:8000/v1/posts/posts/${post.id}/image" alt="${post.title}" style="max-width: 100%;">
            </div>
        `;
    }

    let typeEmoji = '';
    switch (post.type) {
        case 'bug':
            typeEmoji = '🐛';
            break;
        case 'feature':
            typeEmoji = '✨';
            break;
        case 'improvement':
            typeEmoji = '🚀';
            break;
        default:
            typeEmoji = '📄';
    }

    // HTML for the post
    postElement.innerHTML = `
        <div class="col-12">
            <h3>${post.title}</h3>
            <p><strong>Type:</strong> ${typeEmoji} ${post.type}</p>
            <p>${post.content}</p>
            <div class="votes"></div>
        </div>
        ${imageHtml}
        <div class="col-md-6 d-flex justify-content-start">
            <button class="vote-button btn btn-primary" onclick="handleVote(${post.id}, this)">
                <span class="icon">👍</span>
                <span class="vote-count">${votes}</span>
            </button>
        </div>

        <div class="col-md-6 text-end">
            <button class="leave-comment-button btn btn-info" onclick="toggleCommentForm(this)">Leave a Comment</button>
        </div>
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

// Function to handle voting
async function vote(button) {
    const feedbackItem = button.closest('.feedback-item');
    const voteCountElement = feedbackItem.querySelector('.vote-count');
    const positiveButton = feedbackItem.querySelector('.btn-primary'); // "positive" button
    let direction = 1; // Vote direction: 1 for positive

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Authorization required');
        }

        // Check if the user has already voted
        const hasVotedPositive = positiveButton.classList.contains('voted');

        // If the user clicks the already selected button, cancel the vote
        if (hasVotedPositive) {
            direction = 0; // Cancel vote
        }

        // Send a request to the server to register the vote
        const response = await fetch('http://127.0.0.1:8000/v1/vote/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                post_id: parseInt(feedbackItem.dataset.postId), // Post ID
                direction: direction // Vote direction
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const result = await response.json();

        // Update the vote count based on the server response
        if (result.positive_votes !== undefined) {
            voteCountElement.textContent = result.positive_votes;
        }

        // Update the button style based on whether the vote was cast
        if (direction === 1) {
            positiveButton.classList.add('voted');
            positiveButton.style.backgroundColor = '#b6d7a8'; // Change color to green
            positiveButton.style.color = 'white'; // White text
        } else {
            positiveButton.classList.remove('voted');
            positiveButton.style.backgroundColor = ''; // Restore original color
            positiveButton.style.color = ''; // Restore original text color
        }
    } catch (error) {
        console.error('Error voting:', error);
        alert('Failed to vote. Please try again.');
    }
}

// Function to fetch comments
async function fetchComments(postId, feedbackItem) {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Authorization required');
        }

        const response = await fetch(`http://127.0.0.1:8000/v1/posts/${postId}/comments`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const comments = await response.json();

        // Save comments to local state
        commentsState[postId] = comments;

        // Render comments
        renderComments(postId, feedbackItem);
    } catch (error) {
        console.error('Error fetching comments:', error);
        alert('Failed to fetch comments. Please try again.');
    }
}

// Function to render comments
function renderComments(postId, feedbackItem) {
    const commentContent = feedbackItem.querySelector('.comment-content');
    commentContent.innerHTML = ''; // Clear current comments

    // Get comments from local state
    const comments = commentsState[postId] || [];

    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.classList.add('comment');
        commentElement.dataset.commentId = comment.id; // Save comment_id
        commentElement.innerHTML = `
            <strong>${comment.user_id}</strong>: ${comment.content}
            <div class="comment-actions">
                <button class="like-btn" onclick="likeComment(this)">
                    <span class="heart">❤️</span>
                    <span class="like-count">${comment.likes_count || 0}</span>
                </button>
                <button class="delete-btn" onclick="deleteComment(this)">Delete</button>
                <button class="edit-btn" onclick="editComment(this)">Edit</button>
            </div>
        `;
        commentContent.appendChild(commentElement);

        // Set initial heart color if the comment is already liked
        const likeBtn = commentElement.querySelector('.like-btn');
        if (comment.is_liked) {
            likeBtn.classList.add('liked');
            likeBtn.querySelector('.heart').style.color = 'red';
        }
    });
}

// Like a comment
async function likeComment(button) {
    const comment = button.closest('.comment');
    const commentId = comment.dataset.commentId; // Corrected to dataset.commentId
    const postId = comment.closest('.feedback-item').dataset.postId;

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Authorization required');
        }

        // Send a POST request to the server
        const response = await fetch(`http://127.0.0.1:8000/v1/vote/like?comment_id=${commentId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const result = await response.json();

        // Update the like count
        const likeCount = comment.querySelector('.like-count');
        likeCount.textContent = result.likes_count;

        // Update the button state
        const heart = button.querySelector('.heart');
        if (result.is_liked) {
            button.classList.add('liked');
            heart.style.color = 'red'; // Heart turns red if liked
        } else {
            button.classList.remove('liked');
            heart.style.color = ''; // Heart returns to normal if unliked
        }

    } catch (error) {
        console.error('Error liking comment:', error);
    }
}

// Delete a comment
async function deleteComment(button) {
    const isConfirmed = confirm('Are you sure you want to delete this comment?');
    if (!isConfirmed) {
        return; // Cancel deletion if the user does not confirm
    }

    const comment = button.closest('.comment');
    const feedbackItem = button.closest('.feedback-item');
    const postId = feedbackItem.dataset.postId; // Get post_id
    const commentId = comment.dataset.commentId; // Get comment_id

    // Check if post_id and comment_id exist
    if (!postId || !commentId) {
        console.error('post_id or comment_id not found');
        alert('Error: post_id or comment_id not found');
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Authorization required');
        }

        // Send a request to delete the comment
        const response = await fetch(`http://127.0.0.1:8000/v1/posts/${postId}/comments?comment_id=${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        // Remove the comment from local state
        commentsState[postId] = commentsState[postId].filter(c => c.id !== parseInt(commentId));

        // Re-render comments
        renderComments(postId, feedbackItem);
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment. Please try again.');
    }
}

// Edit a comment
function editComment(button) {
    const comment = button.closest('.comment');
    const commentId = comment.dataset.commentId;
    const commentText = comment.querySelector('strong').nextSibling.textContent.trim();
    const feedbackItem = button.closest('.feedback-item');

    // Find the edit form
    const form = feedbackItem.querySelector('.comment-form');
    form.querySelector('textarea').value = commentText;

    // Change the button text to "Save Changes"
    const submitButton = form.querySelector('button');
    submitButton.textContent = 'Save Changes';

    // Remove the old event listener (if any)
    submitButton.replaceWith(submitButton.cloneNode(true));
    const newSubmitButton = form.querySelector('button');

    // Add a new event listener to save changes
    newSubmitButton.onclick = function () {
        saveCommentChanges(commentId, feedbackItem);
    };

    // Show the form
    form.style.display = 'block';
}

// Save comment changes
async function saveCommentChanges(commentId, feedbackItem) {
    const form = feedbackItem.querySelector('.comment-form');
    const newCommentText = form.querySelector('textarea').value;

    if (!newCommentText) {
        alert('Comment cannot be empty.');
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Authorization required');
        }

        const postId = feedbackItem.dataset.postId;

        // Send a request to update the comment
        const response = await fetch(`http://127.0.0.1:8000/v1/posts/${postId}/comments?comment_id=${commentId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: newCommentText
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const updatedComment = await response.json();

        // Update the comment in local state
        const comments = commentsState[postId];
        const commentIndex = comments.findIndex(c => c.id === parseInt(commentId));
        if (commentIndex !== -1) {
            comments[commentIndex] = updatedComment;
        }

        // Re-render comments
        renderComments(postId, feedbackItem);

        // Hide the form and reset its state
        form.style.display = 'none';
        form.querySelector('textarea').value = '';
        form.querySelector('button').textContent = 'Add Comment';
    } catch (error) {
        console.error('Error saving comment changes:', error);
        alert('Failed to save changes. Please try again.');
    }
}

// Add a comment or save changes
async function addComment(button) {
    try {
        // Find the closest feedback-item element
        const feedbackItem = button.closest('.feedback-item');
        if (!feedbackItem) {
            throw new Error('Feedback-item element not found');
        }

        // Get postId
        const postId = feedbackItem.dataset.postId;
        if (!postId) {
            throw new Error('postId not found');
        }

        // Get data from the form
        const nameInput = feedbackItem.querySelector('.comment-form input');
        const commentInput = feedbackItem.querySelector('.comment-form textarea');
        const commentText = commentInput ? commentInput.value.trim() : '';
        const name = nameInput ? nameInput.value.trim() : '';

        // Check that the comment text is not empty
        if (!commentText) {
            throw new Error('Comment text cannot be empty');
        }

        // Get the token from localStorage
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('Authorization required');
        }

        // Show loading indicator
        button.disabled = true;
        button.textContent = 'Submitting...';

        // Send a request to the server
        const response = await fetch(`http://127.0.0.1:8000/v1/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: commentText,
                name: name // If the server expects a username
            })
        });

        // Check the response status
        if (!response.ok) {
            const errorData = await response.json(); // Try to get JSON with the error
            throw new Error(`HTTP error: ${response.status}. ${errorData.detail || 'Unknown error'}`);
        }

        // Get the new comment from the server
        const newComment = await response.json();

        // Add the new comment to local state
        if (!commentsState[postId]) {
            commentsState[postId] = [];
        }
        commentsState[postId].push(newComment);

        // Re-render comments
        renderComments(postId, feedbackItem);

        // Clear the form
        if (nameInput) nameInput.value = '';
        if (commentInput) commentInput.value = '';

        console.log('Comment successfully added:', newComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        alert(error.message || 'Failed to add comment. Please try again.');
    } finally {
        // Restore the button
        button.disabled = false;
        button.textContent = 'Add Comment';
    }
}

// Function to show/hide the comment form
function toggleCommentForm(button) {
    const form = button.closest('.feedback-item').querySelector('.comment-form');
    form.style.display = form.style.display === 'block' ? 'none' : 'block';
}