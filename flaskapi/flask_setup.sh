#!/bin/bash

# Exit on any error
set -e

# Variables
PROJECT_NAME="flask_project"
VENV_NAME="venv"
PYTHON_VERSION="python3"

# Check if python3 is installed
if ! command -v $PYTHON_VERSION &> /dev/null
then
    echo "Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Create project directory
echo "Creating project directory: $PROJECT_NAME"
mkdir $PROJECT_NAME
cd $PROJECT_NAME

# Create and activate virtual environment
echo "Setting up virtual environment..."
$PYTHON_VERSION -m venv $VENV_NAME
source $VENV_NAME/bin/activate

# Install Flask
echo "Installing Flask..."
pip install flask

# Create basic Flask API
cat > app.py << EOL
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"message": "Welcome to your Flask API"})

@app.route('/api/example')
def example():
    return jsonify({"data": "This is an example endpoint"})

if __name__ == '__main__':
    app.run(debug=True)
EOL

# Create requirements.txt
pip freeze > requirements.txt

# Create .gitignore
cat > .gitignore << EOL
__pycache__/
*.pyc
$VENV_NAME/
*.egg-info/
.env
EOL

# Deactivate virtual environment
deactivate

echo "Flask API project setup complete!"
echo "To start the project:"
echo "1. cd $PROJECT_NAME"
echo "2. source $VENV_NAME/bin/activate"
echo "3. python app.py"