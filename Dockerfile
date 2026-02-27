# Base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Cloud Run expects the app to listen on port 8080
ENV PORT=8080
EXPOSE 8080

# Command to run the application
CMD [ "npm", "start" ]
