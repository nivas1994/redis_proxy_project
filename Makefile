
test:

	docker-compose build
	
	docker-compose up -d

	npm run test

run:

	docker-compose build
	
	docker-compose up -d	

