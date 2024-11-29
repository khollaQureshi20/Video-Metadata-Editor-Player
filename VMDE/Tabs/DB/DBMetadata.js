import DBHandler from "./DBHandler";

class DBMetadata {
  constructor() {
    this.dbHandler = new DBHandler();
    this.dbHandler.initializeDatabase();
  }


  insertMetadata = (metadata, persons, locations, events, callback) => {
    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO MetaData (StartTime, EndTime, DateModified,DateCreated, Description, Title, VideoPath,Type) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
        [metadata.starttime, metadata.endtime, metadata.dateCreated, metadata.dateModified, metadata.description, metadata.title, metadata.uri, metadata.type],
        (tx, metadataResult) => {
          const metadataId = metadataResult.insertId;

          persons.forEach(person => {
            tx.executeSql(
              'INSERT INTO MetaDataPerson (MetaDataPerson, PersonId) VALUES (?, ?);',
              [metadataId, person.Id],
              null,
              error => console.log('Error inserting into MetadataPerson: ', error)
            );
          });

          locations.forEach(location => {
            tx.executeSql(
              'INSERT INTO MetaDataLocation (MetadataId, LocationId) VALUES (?, ?);',
              [metadataId, location.Id],
              null,
              error => console.log('Error inserting into MetadataLocation: ', error)
            );
          });

          events.forEach(event => {
            tx.executeSql(
              'INSERT INTO MetaDataEvent (MetadataId, EventId) VALUES (?, ?);',
              [metadataId, event.Id],
              null,
              error => console.log('Error inserting into MetadataEvent: ', error)
            );
          });

          callback();
        },
        error => console.log('Error inserting metadata: ', error)
      );
    });


  };
  insertFrameMetadata = (metadata, callback) => {
    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO MetaData (StartTime, EndTime, Description, VideoPath,Type) VALUES (?, ?, ?, ?, ?);',
        [metadata.starttime, metadata.endtime, metadata.description, metadata.uri, metadata.type],
        (tx, metadataResult) => {
          callback();
        },
        error => console.log('Error inserting metadata: ', error)
      );
    });


  };
  async insertMetadatabyheader(records) {
    console.log(records)
    for (const record of records) {
      try {
        const cityId = await this.getOrCreate('City', 'Name', record.City);
        const locationIds = await this.getOrCreateLocations(record.Location, cityId);
        const eventIds = await this.getOrCreateEvents(record.Event);
        const personIds = await this.getOrCreatePersons(record.People.split(','));
        const selectQuery = `
          SELECT Id 
          FROM MetaData 
          WHERE StartTime = ? AND EndTime = ? AND Title = ? AND VideoPath = ?
        `;

        const existingMetadata = await new Promise((resolve, reject) => {
          this.dbHandler.db.transaction(tx => {
            tx.executeSql(
              selectQuery,
              [record.Startime, record.Endtime, record.Title, record.VideoPath],
              (_, { rows }) => {
                if (rows.length > 0) {
                  resolve(rows.item(0).Id);
                } else {
                  resolve(null);
                }
              },
              (tx, error) => {
                console.error('Error checking existing metadata:', error);
                reject(error);
              }
            );
          });
        });

        if (existingMetadata) {
          console.log(`Metadata for '${record.Title}' already exists. Skipping insert.`);
          continue;
        }

        // Insert new metadata
        const metadataResult = await new Promise((resolve, reject) => {
          this.dbHandler.db.transaction(tx => {
            tx.executeSql(
              'INSERT INTO MetaData (StartTime, EndTime, DateModified, DateCreated, Description, Title, Type, VideoPath) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [
                record.Startime,
                record.Endtime,
                record.DateModified,
                record.DateCreated,
                record.Description,
                record.Title,
                record.Type,
                record.VideoPath
              ],
              (_, result) => {
                resolve(result.insertId);
              },
              (tx, error) => {
                console.error('Error inserting metadata:', error);
                reject(error);
              }
            );
          });
        });

        const metadataId = metadataResult;

        await Promise.all([
          ...personIds.map(personId => this.dbHandler.db.executeSql(
            'INSERT INTO MetaDataPerson (MetaDataPerson, PersonId) VALUES (?, ?)', [metadataId, personId]
          )),
          ...locationIds.map(locationId => this.dbHandler.db.executeSql(
            'INSERT INTO MetaDataLocation (MetaDataId, LocationId) VALUES (?, ?)', [metadataId, locationId]
          )),
          ...eventIds.map(eventId => this.dbHandler.db.executeSql(
            'INSERT INTO MetaDataEvent (MetaDataId, EventId) VALUES (?, ?)', [metadataId, eventId]
          ))
        ]);
      }
      catch (error) {
        console.error('Error processing record:', error);
      }
    }
  }

  async getOrCreate(table, field, value) {
    const selectQuery = `SELECT Id FROM ${table} WHERE ${field} = ?`;
    const insertQuery = `INSERT INTO ${table} (${field}) VALUES (?)`;

    return new Promise((resolve, reject) => {
      this.dbHandler.db.transaction(tx => {
        tx.executeSql(
          selectQuery,
          [value],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(rows.item(0).Id); // .item to properly handle result
            } else {
              tx.executeSql(
                insertQuery,
                [value],
                (_, result) => {
                  resolve(result.insertId);
                },
                (tx, error) => {
                  console.error(`Error inserting into ${table}:`, error);
                  reject(error);
                }
              );
            }
          },
          (tx, error) => {
            console.error(`Error fetching from ${table}:`, error);
            reject(error);
          }
        );
      });
    });
  }

  async getOrCreateLocation(locationTitle, cityId) {
    const selectQuery = `SELECT Id FROM Location WHERE Title = ?`;
    const insertQuery = `INSERT INTO Location (Title, CityId) VALUES (?, ?)`;

    return new Promise((resolve, reject) => {
      this.dbHandler.db.transaction(tx => {
        tx.executeSql(
          selectQuery,
          [locationTitle],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(rows.item(0).Id); // .item to properly handle result
            } else {
              tx.executeSql(
                insertQuery,
                [locationTitle, cityId],
                (_, result) => {
                  resolve(result.insertId);
                },
                (tx, error) => {
                  console.error('Error inserting new location:', error);
                  reject(error);
                }
              );
            }
          },
          (tx, error) => {
            console.error('Error fetching location:', error);
            reject(error);
          }
        );
      });
    });
  }

  async getOrCreateLocations(locations, cityId) {
    try {
      if (!Array.isArray(locations)) {
        locations = [locations];
      }
      const locationIds = await Promise.all(
        locations.map(async location => {
          const trimmedLocation = location.trim();
          return await this.getOrCreateLocation(trimmedLocation, cityId);
        })
      );

      return locationIds;
    } catch (error) {
      console.error('Failed to process locations:', error);
      throw error;
    }
  }

  async getOrCreateEvents(events) {
    try {
      if (!Array.isArray(events)) {
        events = [events];
      }
      const eventIds = await Promise.all(
        events.map(async event => {
          const trimmedevent = event.trim();
          return await this.getOrCreate('Event', 'Title', trimmedevent);
        })
      );
      return eventIds;
    } catch (error) {
      console.error('Failed to process events:', error);
      throw error;
    }
  }

  async getOrCreatePersons(people) {
    const personIds = [];
    for (const person of people) {
      const personId = await this.getOrCreate('Person', 'Name', person.trim());
      personIds.push(personId);
    }
    return personIds;
  }
  async insertShareFrameMetadata(records) {
    console.log(records);

    return new Promise((resolve, reject) => {
      this.dbHandler.db.transaction(tx => {
        for (const record of records) {
          const selectQuery = `
            SELECT Id 
            FROM MetaData 
            WHERE StartTime = ? AND EndTime = ? AND Description = ? AND VideoPath = ? AND Type = ?
          `;

          tx.executeSql(
            selectQuery,
            [record.Starttime, record.Endtime, record.Description, record.VideoPath, record.Type],
            (_, { rows }) => {
              if (rows.length > 0) {
                console.log('Frame already exists. Skipping insert.');
              } else {
                const insertQuery = `
                  INSERT INTO MetaData (StartTime, EndTime, Description, VideoPath, Type) 
                  VALUES (?, ?, ?, ?, ?)
                `;

                tx.executeSql(
                  insertQuery,
                  [record.Starttime, record.Endtime, record.Description, record.VideoPath, record.Type],
                  (_, result) => {
                    console.log('Inserted metadata:', result);
                  },
                  (tx, error) => {
                    console.error('Error inserting metadata:', error);
                    reject(error);
                  }
                );
              }
            },
            (tx, error) => {
              console.error('Error checking existing metadata:', error);
              reject(error);
            }
          );
        }
      },
        (error) => {
          console.error('Transaction error:', error);
          reject(error);
        },
        () => {
          resolve();
        });
    });
  }


  getMetadata = (videoPath, callback) => {
    const query = `SELECT 
    MetaData.Id,
    MetaData.Title,
    MetaData.StartTime,
    MetaData.EndTime,
    MetaData.DateCreated,
    MetaData.DateModified,
    MetaData.Description,
    MetaData.VideoPath,
    MetaData.Type,
    GROUP_CONCAT(DISTINCT Event.Title) AS EventTitle,
    GROUP_CONCAT(DISTINCT Event.Id) AS EventId,
    GROUP_CONCAT(DISTINCT Location.Title) AS LocationTitle,
    GROUP_CONCAT(DISTINCT Location.Id) AS LocationId,
    GROUP_CONCAT(DISTINCT Person.Name) AS PersonName,
    GROUP_CONCAT(DISTINCT Person.Id) AS PersonId,
    GROUP_CONCAT(DISTINCT City.Name) AS CityName,
    GROUP_CONCAT(DISTINCT City.Id) AS CityId
FROM 
    MetaData
INNER JOIN 
    MetaDataEvent ON MetaData.Id = MetaDataEvent.MetadataId
INNER JOIN 
    Event ON MetaDataEvent.EventId = Event.Id
INNER JOIN  
    MetaDataLocation ON MetaData.Id = MetaDataLocation.MetadataId
INNER JOIN 
    Location ON MetaDataLocation.LocationId = Location.Id
INNER JOIN 
    MetaDataPerson ON MetaData.Id = MetaDataPerson.MetaDataPerson
INNER JOIN 
    Person ON MetaDataPerson.PersonId = Person.Id
INNER JOIN 
    City ON Location.CityId = City.Id
WHERE 
    MetaData.VideoPath = '${videoPath}'
	GROUP BY
    MetaData.Id
    ORDER BY MetaData.Id DESC;
`;

    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const metadata = rows.raw();
          callback(metadata);
        },
        error => console.log('Error fetching metadata: ', error)
      );
    });
  };
  getMetadataByClip = (id, callback) => {
    const query = `SELECT 
    MetaData.Id,
    MetaData.Title,
    MetaData.StartTime,
    MetaData.EndTime,
    MetaData.DateCreated,
    MetaData.DateModified,
    MetaData.Description,
    MetaData.VideoPath,
    MetaData.Type,
    GROUP_CONCAT(DISTINCT Event.Title) AS EventTitle,
    GROUP_CONCAT(DISTINCT Event.Id) AS EventId,
    GROUP_CONCAT(DISTINCT Location.Title) AS LocationTitle,
    GROUP_CONCAT(DISTINCT Location.Id) AS LocationId,
    GROUP_CONCAT(DISTINCT Person.Name) AS PersonName,
    GROUP_CONCAT(DISTINCT Person.Id) AS PersonId,
    GROUP_CONCAT(DISTINCT City.Name) AS CityName,
    GROUP_CONCAT(DISTINCT City.Id) AS CityId
FROM 
    MetaData
INNER JOIN 
    MetaDataEvent ON MetaData.Id = MetaDataEvent.MetadataId
INNER JOIN 
    Event ON MetaDataEvent.EventId = Event.Id
INNER JOIN  
    MetaDataLocation ON MetaData.Id = MetaDataLocation.MetadataId
INNER JOIN 
    Location ON MetaDataLocation.LocationId = Location.Id
INNER JOIN 
    MetaDataPerson ON MetaData.Id = MetaDataPerson.MetaDataPerson
INNER JOIN 
    Person ON MetaDataPerson.PersonId = Person.Id
INNER JOIN 
    City ON Location.CityId = City.Id WHERE 
    MetaData.Id='${id}' OR MetaData.VideoPath='${id}.mp'`;

    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const metadata = rows.raw();

          callback(metadata);
        },
        error => console.log('Error fetching metadata: ', error)
      );
    });
  }

  getFrameMetadata = (videoPath, callback) => {
    const query = `SELECT * FROM MetaData WHERE 
    MetaData.VideoPath = '${videoPath}' AND Type='f'
	;
`;

    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const fmetadata = rows.raw();

          callback(fmetadata);
        },
        error => console.log('Error fetching metadata: ', error)
      );
    });
  };

  getExactFrameMetadata = (videoPath, starttime, endtime, callback) => {

    const query = `SELECT * FROM MetaData WHERE 
  MetaData.VideoPath = '${videoPath}' AND 
  Type = 'f' AND 
  StartTime >= '${starttime}' AND 
  EndTime <= '${endtime}';
`;

    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const fmetadata = rows.raw();
          callback(fmetadata);
        },
        error => console.log('Error fetching metadata: ', error)
      );
    });
  };
  getExactMetadata = (videoPath, starttime, callback) => {
    const query = `SELECT *
FROM MetaData
WHERE (
    StartTime <= '${starttime}' AND EndTime >= '${starttime}'
  )
  AND VideoPath = '${videoPath}'
  AND Type='c';
`
    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const metadata = rows.raw();
          callback(metadata);
        },
        error => console.log('Error fetching metadata: ', error)
      );
    });
  }
  deleteMetadata = (id) => {
    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM MetaDataPerson WHERE MetaDataPerson = ?;',
        [id],
        msg => console.log('ID ', id, ' are Successfully Deleted into MetadataPerson: '),
        error => console.log('Error Deleted into MetadataPerson: ', error)
      )
      tx.executeSql(
        'DELETE FROM MetaDataLocation WHERE MetadataId = ?;',
        [id],
        msg => console.log('ID ', id, ' are Successfully Deleted into MetaDataLocation: '),
        error => console.log('Error Deleted into MetadataPerson: ', error)
      )
      tx.executeSql(
        'DELETE FROM MetaDataEvent WHERE MetadataId = ?;',
        [id],
        msg => console.log('ID ', id, ' are Successfully Deleted into MetaDataEvent: '),
        error => console.log('Error Deleted into MetaDataEvent: ', error)
      )
      tx.executeSql(
        'DELETE FROM MetaData WHERE Id = ?;',
        [id],
        msg => console.log('ID ', id, ' are Successfully Deleted into MetaData: '),
        error => console.log('Error Deleted into MetaData: ', error)
      )
    }
    )

  };
  deleteFrameMetadata = (id) => {
    this.dbHandler.db.transaction(tx => {

      tx.executeSql(
        'DELETE FROM MetaData WHERE Id = ?;',
        [id],
        msg => console.log('ID ', id, ' are Successfully Deleted into MetaData: '),
        error => console.log('Error Deleted into MetaData: ', error)
      )
    }
    )

  };


  updateMetadata = async (metadata, selectedPersonIds, selectedLocationIds, selectedEventIds, callback) => {

    this.dbHandler.db.transaction(tx => {

      tx.executeSql(
        'UPDATE MetaData SET StartTime=?, EndTime=?, DateCreated=?,DateModified=?, Description=?, Title=? , Type=? WHERE Id=?;',
        [metadata.starttime, metadata.endtime, metadata.datecreated, metadata.datemodified, metadata.description, metadata.title, metadata.type, metadata.Id],
        (tx, results) => {
          if (results.rowsAffected > 0) {

            tx.executeSql(
              'DELETE FROM MetaDataPerson WHERE MetaDataPerson=?;',
              [metadata.Id],
              () => {

                selectedPersonIds.forEach(personId => {
                  tx.executeSql(
                    'INSERT INTO MetaDataPerson (MetaDataPerson,PersonId) VALUES (?, ?);',
                    [metadata.Id, personId],
                    () => { console.log('SucessFully') },
                    error => console.log('Error inserting into MetaDataPerson table: ', error)
                  );
                });
              },
              error => console.log('Error deleting from MetaDataPerson table: ', error)
            );

            tx.executeSql(
              'DELETE FROM MetaDataLocation WHERE MetaDataId=?;',
              [metadata.Id],
              () => {

                selectedLocationIds.forEach(locationId => {
                  tx.executeSql(
                    'INSERT INTO MetaDataLocation (MetaDataId, LocationId) VALUES (?, ?);',
                    [metadata.Id, locationId],
                    () => { },
                    error => console.log('Error inserting into MetaDataLocation table: ', error)
                  );
                });
              },
              error => console.log('Error deleting from MetaDataLocation table: ', error)
            );

            tx.executeSql(
              'DELETE FROM MetaDataEvent WHERE MetaDataId=?;',
              [metadata.Id],
              () => {

                selectedEventIds.forEach(eventId => {
                  tx.executeSql(
                    'INSERT INTO MetaDataEvent (MetaDataId, EventId) VALUES (?, ?);',
                    [metadata.Id, eventId],
                    () => { },
                    error => console.log('Error inserting into MetaDataEvent table: ', error)
                  );
                });
              },
              error => console.log('Error deleting from MetaDataEvent table: ', error)
            );

            callback();
          }
        },
        error => console.log('Error updating metadata: ', error)
      );
    });
  };

  updateFrameMetadata = async (metadata, callback) => {
    this.dbHandler.db.transaction(tx => {

      tx.executeSql(
        'UPDATE MetaData SET StartTime=?, EndTime=?, Description=? WHERE Id=?;',
        [metadata.starttime, metadata.endtime, metadata.description, metadata.Id],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            callback();
          }
        },
        error => console.log('Error updating metadata: ', error)
      );
    });
  };

  searchMetadata = (searchWord, callback) => {
    console.log(searchWord)
    const searchWords = searchWord.split(',');
    let query = `SELECT DISTINCT
    MetaData.VideoPath,
    MetaData.Id,
    MetaData.Title,
    MetaData.StartTime,
    MetaData.EndTime,
    MetaData.DateCreated,
    MetaData.DateModified,
    MetaData.Description,
	City.Name as CityName
  FROM
    MetaData
  INNER JOIN
    MetaDataEvent ON MetaData.Id = MetaDataEvent.MetadataId
  INNER JOIN
    Event ON MetaDataEvent.EventId = Event.Id
  INNER JOIN
    MetaDataLocation ON MetaData.Id = MetaDataLocation.MetadataId
  INNER JOIN
    Location ON MetaDataLocation.LocationId = Location.Id
  INNER JOIN
    MetaDataPerson ON MetaData.Id = MetaDataPerson.MetaDataPerson
  INNER JOIN
    Person ON MetaDataPerson.PersonId = Person.Id
  INNER JOIN
    City ON Location.CityId = City.Id
  WHERE`;

    let excludeMode = false;

    for (let i = 0; i < searchWords.length; i++) {
      const hasNextWord = i < searchWords.length - 1 && searchWords[i + 1].trim().length > 0;
      if (searchWords[i] === 'not') {
        excludeMode = true;
        continue;
      }

      let condition;
      if (excludeMode && i > 0 && searchWords[i - 1] === 'not') {
        condition = `Event.Title NOT LIKE '${searchWords[i]}' 
                        AND Location.Title NOT LIKE '${searchWords[i]}' 
                        AND Person.Name NOT LIKE '${searchWords[i]}' 
                        AND City.Name NOT LIKE '${searchWords[i]}'`;
      }
      else {
        condition = `(Event.Title LIKE '${searchWords[i]}' 
                        OR Location.Title LIKE '${searchWords[i]}' 
                        OR Person.Name LIKE '${searchWords[i]}' 
                        OR City.Name LIKE '${searchWords[i]}')`;
      }

      query += condition;
      if (hasNextWord) {
        query += ' OR ';
      } else {
        break;
      }
    }

    query += `
     
      
    `;
    console.log("Executing query:", query);

    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const metadata = rows.raw();

          callback(metadata);
        },
        error => console.log('Error fetching metadata: ', error)
      );
    });
  }

  getMetadataByID = (id, callback) => {
    const query = `SELECT MetaData.* FROM MetaData  WHERE MetaData.Id = '${id}'`;

    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const metadata = rows.raw();
          callback(metadata);
        },
        error => console.log('Error fetching metadata: ', error)
      );
    });
  };
  getPeopleMetadataByID = (id, callback) => {
    const query = `SELECT Person.* FROM Person INNER JOIN MetaDataPerson ON Person.Id = MetaDataPerson.PersonId WHERE MetaDataPerson.MetaDataPerson ='${id}'`;

    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const pmetadata = rows.raw();
          callback(pmetadata);
        },
        error => console.log('Error fetching metadata: ', error)
      );
    });
  };
  getLocationMetadataByID = (id, callback) => {
    const query = `
        SELECT Location.*, City.Name as CityName 
        FROM Location
        INNER JOIN MetaDataLocation ON Location.Id = MetaDataLocation.LocationId
        INNER JOIN City ON Location.CityId = City.Id
        WHERE MetaDataLocation.MetadataId = '${id}'
    `;

    this.dbHandler.db.transaction(tx => {
        tx.executeSql(
            query,
            [],
            (_, { rows }) => {
                const lmetadata = rows.raw(); 
                callback(lmetadata); 
            },
            error => console.error('Error fetching metadata: ', error)
        );
    });
};

  getEventMetadataByID = (id, callback) => {
    const query = `SELECT Event.* FROM Event INNER JOIN MetaDataEvent ON Event.Id = MetaDataEvent.EventId WHERE MetaDataEvent.MetadataId = '${id}'`;

    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const emetadata = rows.raw();
          callback(emetadata);
        },
        error => console.log('Error fetching metadata: ', error)
      );
    });
  };

  getAllMetadata = (callback) => {
    const query = `SELECT 
    *
FROM 
    MetaData
WHERE Type='c'
`;

    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const metadata = rows.raw();
          callback(metadata);
        },
        error => console.log('Error fetching metadata: ', error)
      );
    });

  }
  getAllvideoMetadata = (callback) => {
    const query = `SELECT 
    DISTINCT VideoPath
FROM 
    MetaData
WHERE Type='c'
`;

    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const metadata = rows.raw();
          callback(metadata);
        },
        error => console.log('Error fetching metadata: ', error)
      );
    });

  }
  getTitle = (videoPath,callback) => {
    const query = `SELECT 
   Title
FROM 
    MetaData
WHERE 
    MetaData.VideoPath = '${videoPath}' AND Type='c'
`;

    this.dbHandler.db.transaction(tx => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const metadata = rows.raw();
          callback(metadata);
        },
        error => console.log('Error fetching metadata: ', error)
      );
    });

  }
  
}

export default DBMetadata;
