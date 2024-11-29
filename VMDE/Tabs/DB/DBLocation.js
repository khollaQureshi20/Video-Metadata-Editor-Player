import DBHandler from "./DBHandler";

class DBLocation {
  constructor() {
    this.dbHandler = new DBHandler();
    this.dbHandler.initializeDatabase();
  }
  
 
  insertLocation = (name,CityId, callback) => {
    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO Location (Title,CityId) VALUES (?,?);',
        [name,CityId],
        () => {
          console.log('Location inserted successfully');
          callback();
        },
        error => console.log('Error inserting Location: ', error)
      );
    });
  };
  fetchLocationsByCity = (cityId, callback) => {
    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        'SELECT Id,Title FROM Location WHERE CityId=?',
        [cityId],
        (_, { rows }) => {
          const locations = rows.raw();
          callback(locations);
        },
        error => console.log('Error fetching Location: ', error)
      );
    });
};
fetchLocations = (callback) => {
  this.dbHandler.db.transaction(tx => {
    tx.executeSql(
      'SELECT Id,Title FROM Location',
      [],
      (_, { rows }) => {
        const locations = rows.raw();
        callback(locations);
      },
      error => console.log('Error fetching Location: ', error)
    );
  });
};
}

export default DBLocation;
