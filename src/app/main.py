from fastapi import FastAPI
from .routers import post, user, root, auth, vote
from fastapi.middleware.cors import CORSMiddleware

title = "Blog FastAPI for feedback"
description = f"""
{title} helps you streamline the collection and processing of user feedback on internal services. 🚀

## Blogs for feedback

This platform allows users to share their thoughts, ideas, and experiences, enabling continuous improvement and development of internal services.

You will be able to:

* **Create blogs** to share feedback, suggestions, or reports.
* **Read all blogs** to stay informed about the feedback from others.
* **Delete own blogs** if needed.
* **Vote blogs** to highlight useful or important feedback.

## Users

You will be able to:

* **Create users** for managing feedback submissions.
* **Login users** to access and interact with the feedback system.

By using this platform, we aim to foster better communication and enhance the overall user experience within the internal systems.
"""

app = FastAPI(
    title=title,
    description=description,
    version="0.0.1",
    terms_of_service="http://example.com/terms/",
    contact={
        "name": "Kyrawamnedura",
        "email": "olyabjj@gmail.com",
    },
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    }
)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(root.router)
app.include_router(auth.router)
app.include_router(post.router)
app.include_router(user.router)
app.include_router(vote.router)
