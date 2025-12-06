# Use an official Node runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /backend/admin-dashboard

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json yarn.lock* ./

# Install dependencies
RUN yarn install

# Copy the rest of the app's source code
COPY app ./app
COPY public ./public
COPY tsconfig.json ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY next.config.js ./
COPY .env ./

FROM base as production
# Build the application (important for TypeScript)
RUN yarn run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["yarn", "run", "start"]
