run: ## runs the server
	python3 -m http.server 8888

get-files:
	python3 -c 'import os; print(", ".join(map(lambda x: f"\"{x}\"", os.listdir("problems"))))'
