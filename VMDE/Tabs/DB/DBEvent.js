import DBHandler from "./DBHandler";

class DBEvent {
  constructor() {
    this.dbHandler = new DBHandler();
    this.dbHandler.initializeDatabase();
  }
  
  fetchEvent = (callback) => {
    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Event',
        [],
        (_, { rows }) => {
          const event = rows.raw();
          callback(event);
        },
        error => console.log('Error fetching Event: ', error)
      );
    });
  };

  insertEvent = (name, callback) => {
    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO Event (Title) VALUES (?);',
        [name],
        () => {
          console.log('Event inserted successfully');
          callback();
        },
        error => console.log('Error inserting Event: ', error)
      );
    });
  };
}

export default DBEvent;
