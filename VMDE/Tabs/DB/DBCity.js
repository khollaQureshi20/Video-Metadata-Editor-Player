import DBHandler from "./DBHandler";

class DBCity {
  constructor() {
    this.dbHandler = new DBHandler();
    this.dbHandler.initializeDatabase();
  }
  
  fetchCity = (callback) => {
    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM City',
        [],
        (_, { rows }) => {
          const city = rows.raw();
          callback(city);
        },
        error => console.log('Error fetching city: ', error)
      );
    });
  };
  
 
  insertCity = (name, callback) => {
    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO City (Name) VALUES (?);',
        [name],
        () => {
          console.log('city inserted successfully');
          callback();
        },
        error => console.log('Error inserting city: ', error)
      );
    });
  };
}

export default DBCity;
