import { openDatabase } from 'react-native-sqlite-storage';

class DBHandler {
  constructor() {
    this.db = null;
  }

  initializeDatabase() {
    this.db = openDatabase(
      { name: 'VideoMetadata.db', location: 'default' },
      () => {
        
      },
      error => {
        console.log("Failed to open database: ", error);
      }
    );
  }
}

export default DBHandler;
