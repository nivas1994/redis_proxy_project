
test:

	docker-compose build
	
	docker-compose up -d

	./integration_test.sh

run:

	docker-compose build
	
	docker-compose up -d	

