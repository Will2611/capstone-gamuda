Make sure you have Python 3.12.7 installed

#Windows:
Run py -3.12 -m venv to create the virtual environment, creating folder named 'venv'
Run 'venv\Scripts\activate` in cli to start the virtual environment

#Mac/Linux
Run python3 -m venv to create the virtual environment, creating a folder named 'venv'
Run 'source venv/bin/activate` in cli to start the virtual environment

Once in virtual environment you can start pip installing packages, run pip install -r requirements.txt

To ensure you're using your vsCode can understand the packagess installed, open command pallete and switch python interpretor to be using the python.exe found in venv
