# Setup Instructions for LocalConnect

## Prerequisites
Before you begin, ensure you have the following software installed:
- Node.js (version X.X.X or higher)
- npm (Node Package Manager)
- MongoDB Atlas (cloud-based database)

## Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/zusy08/LocalConnect.git
   ```
2. Navigate into the project directory:
   ```bash
   cd LocalConnect
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```

## Environment Configuration
1. Create a `.env` file in the root directory of the project.
2. Add the following environment variables:
   ```ini
   DB_URI=mongodb+srv://username:password@cluster.mongodb.net/localconnect
   PORT=3000
   ```

## Database Setup
1. Set up MongoDB Atlas:
   - Go to https://cloud.mongodb.com/
   - Create a free account and cluster
   - Get your connection string from Atlas dashboard
   - Replace username/password in the DB_URI above
2. Your database will be created automatically on first connection`

## Running the Application
1. Start the application:
   ```bash
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000`.

## Troubleshooting Guide
- If you encounter issues with dependencies, try running:
   ```bash
   npm install --force
   ```
- Check MongoDB Atlas logs for connection issues.
- Ensure your Node.js version is compatible by checking with:
   ```bash
   node -v
   ```

For further assistance, refer to the issues section on GitHub or contact support.