Make sure you have Python 3.12.7 installed

#Windows:
Run `py -3.12 -m venv venv` to create the virtual environment, creating folder named 'venv'
Run `venv\Scripts\activate` in cli to start the virtual environment

#Mac/Linux
Run `python3 -m venv venv` to create the virtual environment, creating a folder named 'venv'
Run `source venv/bin/activate` in cli to start the virtual environment

Once in virtual environment you can start pip installing packages, run `pip install -r requirements.txt`

To ensure you're using your vsCode can understand the packagess installed, open command pallete (Ctrl+P on windows) and switch python interpretor to be using the python.exe found in venv

#Remember to set up .env file

To start running the server for development run `uvicorn src.main:app --reload`


--------------------------------------------------------------------------------------------------------------------------------------------------

Create a new db called food_db to test out chatbot with a db 
Adjust .env file so will connect to the right db

Login
gcloud auth application-default login

gcloud auth application-default set-quota-project YOUR_PROJECT_ID
