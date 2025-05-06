# TextVault

TextVault is a comprehensive text archiving system with AI generation and rating capabilities. It helps organizations create, store, and improve text content through a centralized text library.

## Features

- **Text Archive**: Organize texts in categories and folders with tagging and version control
- **Export & Format**: Export to PDF, DOCX, HTML, Markdown with customizable templates
- **Rating System**: Track performance metrics, A/B testing, and visualize text performance
- **AI Text Generation**: Generate texts based on themes and learn from high-performing content
- **Subscription System**: Different tiers with varying features and limits

## Tech Stack

### Backend
- Django 4.2+ with Django REST Framework
- PostgreSQL for database
- JWT for authentication
- OpenAI/Claude for AI integration
- Celery for background tasks

### Frontend (Coming Soon)
- React with Next.js
- Tailwind CSS
- Slate.js for rich text editing
- Chart.js for analytics visualization

## Getting Started

### Prerequisites
- Python 3.9+
- PostgreSQL (optional, SQLite for development)
- Node.js and npm (for frontend)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/textvault.git
cd textvault
```

2. Set up the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Configure environment variables
```bash
# Edit the .env file with your settings
```

4. Run migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create a superuser
```bash
python manage.py createsuperuser
```

6. Run the development server
```bash
python manage.py runserver
```

7. Access the API at http://localhost:8000/api/v1/

## API Documentation

API documentation is available at:
- Swagger UI: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/

## License

This project is proprietary and not licensed for public use.

## Acknowledgments

- OpenAI/Claude for AI capabilities
- Django and React communities for excellent frameworks
