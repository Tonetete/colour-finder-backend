import { NewGame } from "./NewGame";

jest.mock("aws-sdk/clients/s3", () => {
  return class S3 {
    indexFile = "index.txt";
    region;
    constructor({ region }) {
      this.region = region;
    }
    getObject() {}
    putObject() {}
  };
});

describe("NewGame Lambda UT", () => {
  test("WHEN index file doesn't exist in the bucket THEN should create it and upload it and return true", async () => {
    const error = "INDEX FILE NOT FOUND";
    const data = {};

    NewGame.init();
    NewGame.s3.getObject = jest.fn((params, cb) => cb(error, data));
    NewGame.s3.putObject = jest.fn((params, cb) => cb(null, {}));

    const result = await NewGame.checkIndexFile();

    expect(result).toBe(true);
  });

  test("WHEN index file exists in the bucket THEN should not create it and return true", async () => {
    const error = null;
    const data = {};

    NewGame.init();
    NewGame.s3.getObject = jest.fn((params, cb) => cb(error, data));
    // NewGame.s3.putObject = jest.fn((params, cb) => cb(null, {}));

    const result = await NewGame.checkIndexFile();

    expect(result).toBe(true);
  });

  test("WHEN there's an error in index file creation THEN should throw exception", async () => {
    const errorGET = "INDEX FILE NOT FOUND";
    const errorPUT = "INDEX FILE NOT CREATED";
    const data = {};

    NewGame.init();
    NewGame.s3.getObject = jest.fn((params, cb) => cb(errorGET, data));
    NewGame.s3.putObject = jest.fn((params, cb) => cb(errorPUT, {}));

    try {
      await NewGame.checkIndexFile();
    } catch (e) {
      expect(e.message).toBe(errorPUT);
    }
  });

  test("WHEN get last index value from file THEN should return last index increased by 1", async () => {
    const data = {
      Body: {
        toString: () => "1",
      },
    };

    NewGame.init();
    NewGame.s3.getObject = jest.fn((params, cb) => cb(null, data));
    NewGame.s3.putObject = jest.fn((params, cb) => cb(null, { success: true }));

    const result = await NewGame.getLastIndex();
    expect(result).toBe("2");
  });

  test("WHEN get last index value from file doesn't exist THEN should throw an error", async () => {
    const data = {
      Body: {
        toString: () => "1",
      },
    };

    const errorGET = "INDEX FILE NOT FOUND";

    NewGame.init();
    NewGame.s3.getObject = jest.fn((params, cb) => cb(errorGET, data));

    try {
      await NewGame.getLastIndex();
    } catch (e) {
      expect(e.message).toBe(errorGET);
    }
  });

  test("WHEN create a new index file with last index value fails THEN should throw an error", async () => {
    const data = {
      Body: {
        toString: () => "1",
      },
    };

    const errorPUT = "INDEX FILE NOT CREATED";

    NewGame.init();
    NewGame.s3.getObject = jest.fn((params, cb) => cb(null, data));
    NewGame.s3.putObject = jest.fn((params, cb) => cb(errorPUT, data));

    try {
      await NewGame.getLastIndex();
    } catch (e) {
      expect(e.message).toBe(errorPUT);
    }
  });

  test("WHEN create a new index file returns a falsy value THEN should throw an error", async () => {
    const data = {
      Body: {
        toString: () => "1",
      },
    };

    const error = "There was an error creating/editing the index file";

    NewGame.init();
    NewGame.s3.getObject = jest.fn((params, cb) => cb(null, data));
    NewGame.s3.putObject = jest.fn((params, cb) => cb(null, null));

    try {
      await NewGame.getLastIndex();
    } catch (e) {
      expect(e.message).toBe(error);
    }
  });

  test("WHEN create a new game file THEN should return a new index for the user", async () => {
    const error = "There was an error creating/editing the index file";

    NewGame.init();
    NewGame.checkIndexFile = jest.fn(() => Promise.resolve(true));
    NewGame.getLastIndex = jest.fn(() => Promise.resolve("1"));
    NewGame.s3.putObject = jest.fn((params, cb) => cb(null, {}));

    const result = await NewGame.create();
    expect(result).toBe("1");
  });

  test("WHEN create a new game file but fails editing the game state for the index value file ' \
  THEN should throw an error", async () => {
    const error = "ERROR EDITING GAME STATE FOR INDEX FILE VALUE";

    NewGame.init();
    NewGame.checkIndexFile = jest.fn(() => Promise.resolve(true));
    NewGame.getLastIndex = jest.fn(() => Promise.resolve("1"));
    NewGame.s3.putObject = jest.fn((params, cb) => cb(error, {}));

    try {
      await NewGame.create();
    } catch (e) {
      expect(e.message).toBe(error);
    }
  });

  test("WHEN create a new game file there was an error checking the index file ' \
  THEN should throw an error", async () => {
    const error = "No index file were created.";

    NewGame.init();
    NewGame.checkIndexFile = jest.fn(() => Promise.resolve(false));

    try {
      await NewGame.create();
    } catch (e) {
      expect(e.message).toBe(error);
    }
  });
});
