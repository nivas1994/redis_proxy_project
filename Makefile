
test:
	# here it is useful to add your own customised tests

	docker-compose build
	
	docker-compose up -d

	npm run test
	# docker-compose -p $(PROJECT_NAME)_$(HOST_UID) run --rm $(SERVICE_TARGET) sh -c '\
	# 	echo "I am `whoami`. My uid is `id -u`." && echo "Docker runs!"' \
	# && echo success