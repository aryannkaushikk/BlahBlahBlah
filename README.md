# Chat App (Flask + Socket.IO)

This is a real-time chat application built using Flask, Flask-SocketIO, and PostgreSQL. The app allows users to join chat rooms, send and receive messages, and interact with other users in real-time. It features a simple user interface built with HTML, CSS, and JavaScript.

## Features

- User login and room creation
- Real-time messaging using Socket.IO
- Display of all users currently in the room
- Message history persistence (stored in PostgreSQL database)
- User join/leave notifications
- System messages (e.g., "user has joined the room")

## Installation

### Prerequisites

- Python 3.x
- PostgreSQL (for database)
- `virtualenv` or `conda` (for virtual environment management)

### Setting Up the Project

1. Clone the repository:

    ```bash
    git clone https://github.com/aryannkaushikk/Project-Chat.git
    cd Project-Chat
    ```

2. Set up a virtual environment:

   - Using `conda`:
     ```bash
     conda create -n chat-app python=3.9
     conda activate chat-app
     ```

   - Or, using `virtualenv`:
     ```bash
     python -m venv venv
     source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
     ```

3. Install the required dependencies:

    ```bash
    pip install -r requirements.txt
    ```

4. Set up the PostgreSQL database:
   - Ensure PostgreSQL is installed and running on your machine.
   - Create a database (e.g., `chat_db`) and update the database URI in the `app.py` file if needed.

5. Initialize the database:
    ```bash
    python
    >>> from app import db
    >>> db.create_all()
    >>> exit()
    ```

6. Run the application:
    ```bash
    flask run
    ```

7. Visit `http://127.0.0.1:5000/` in your browser to access the chat app.

## Deployment

### Deploying on Render

1. Create a `Procfile` in the root directory with the following content:

    ```
    web: gunicorn app:app
    ```

2. Follow the steps on [Render's website](https://render.com/docs/deploy-flask) to deploy the application.

3. Set up the environment variables on Render for the PostgreSQL database connection.

4. Push the changes to GitHub and connect your repository to Render to trigger the deployment.

### Deploying on Vercel

1. For Vercel, follow the [Vercel Flask deployment guide](https://vercel.com/docs/frameworks/flask) to deploy your Flask app.

2. Set up necessary environment variables (like `DATABASE_URL`) on Vercel for database configuration.

3. Connect your GitHub repository to Vercel and push changes to deploy the app.

## Contributing

Feel free to fork this project, submit issues, and create pull requests to improve the app!

## License

This project is open-source and available under the [MIT License](LICENSE).
