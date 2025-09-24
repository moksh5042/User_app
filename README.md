# User App

This project is a mobile application built with Expo (React Native) for users to search, view, and book bus rides, as well as view route and driver details in real time.

## Features
- Search for available routes and drivers
- View driver and route details
- Real-time map and route tracking
- Book rides
- Firebase integration for backend services

## Project Structure
```
App.js
app.json
index.js
package.json
assets/
src/
  components/
    DriverDetailScreen.js
    MapScreen.js
    RouteDetailsScreen.js
    SearchScreen.js
  services/
    firebaseConfig.js
    firebaseService.js
```

## Getting Started

### Prerequisites
- Node.js (v16 or above recommended)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd UserExpo
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Set up your Firebase credentials in `src/services/firebaseConfig.js`.

### Running the App
```bash
expo start
```
Scan the QR code with the Expo Go app on your mobile device to run the app.

## Usage
- Search for routes and drivers
- View details and book rides

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
MIT
