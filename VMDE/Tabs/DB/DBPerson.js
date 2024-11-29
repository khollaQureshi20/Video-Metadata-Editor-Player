import DBHandler from "./DBHandler";

class DBPerson {
  constructor() {
    this.dbHandler = new DBHandler();
    this.dbHandler.initializeDatabase();
  }
  
  fetchPersons = (callback) => {
    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Person',
        [],
        (_, { rows }) => {
          const persons = rows.raw();
          callback(persons);
        },
        error => console.log('Error fetching person: ', error)
      );
    });
  };

  insertPerson = (name, callback) => {
    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO Person (Name) VALUES (?);',
        [name],
        () => {
          console.log('Person inserted successfully');
          callback();
        },
        error => console.log('Error inserting person: ', error)
      );
    });
  };
}

export default DBPerson;
