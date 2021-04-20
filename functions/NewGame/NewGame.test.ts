import { NewGame } from "./NewGame";

jest.mock("aws-sdk/clients/s3", () => {
  return class S3 {
    dataFileName = "data.json";
    region;
    constructor({ region }) {
      this.region = region;
    }
    getObject() {}
    putObject() {}
  };
});

const dataMock = {
  lastIndex: 0,
  games: [],
};

describe("NewGame Lambda UT", () => {
  beforeEach(() => {
    NewGame.init(3);
  });
  test("WHEN data file doesn't exist in the bucket THEN should create it and upload it and return true", async () => {
    const error = { name: "NoSuchKey" };

    NewGame.s3.getObject = jest.fn((params, cb) => cb(error, {}));
    NewGame.s3.putObject = jest.fn((params, cb) => cb(null, { ...dataMock }));

    const result = await NewGame.checkDataFile();

    expect(result).toEqual(dataMock);
  });

  test("WHEN data file exists in the bucket THEN should return it", async () => {
    NewGame.s3.getObject = jest.fn((params, cb) =>
      cb(null, { Body: { toString: () => JSON.stringify({ ...dataMock }) } })
    );
    NewGame.s3.putObject = jest.fn((params, cb) => cb(null, {}));

    const result = await NewGame.checkDataFile();

    expect(result).toEqual(dataMock);
  });

  test("WHEN there was an unexpected error retrieving data file THEN should throw an exception", async () => {
    const error = "UNEXPECTED ERROR";
    NewGame.s3.getObject = jest.fn((params, cb) => cb(error, {}));
    NewGame.s3.putObject = jest.fn((params, cb) => cb(null, {}));

    try {
      await NewGame.checkDataFile();
    } catch (e) {
      expect(e.message).toBe(error);
    }
  });

  test("WHEN there was an unexpected error creating the data file THEN should throw an exception", async () => {
    const error = "UNEXPECTED ERROR";
    const errorGET = { name: "NoSuchKey" };
    NewGame.s3.getObject = jest.fn((params, cb) => cb(errorGET, {}));
    NewGame.s3.putObject = jest.fn((params, cb) => cb(error, {}));

    try {
      await NewGame.checkDataFile();
    } catch (e) {
      expect(e.message).toBe(error);
    }
  });

  test("WHEN create a new game file THEN should return a new index for the user", async () => {
    NewGame.checkDataFile = jest.fn(() => Promise.resolve({ ...dataMock }));
    NewGame.s3.putObject = jest.fn((params, cb) => cb(null, {}));

    const result = await NewGame.create();
    expect(result).toBe(1);
  });

  test("WHEN create a new game and data file has no games THEN should create array of games", async () => {
    NewGame.checkDataFile = jest.fn(() => Promise.resolve({ lastIndex: 0 }));
    NewGame.s3.putObject = jest.fn((params, cb) => cb(null, {}));

    const result = await NewGame.create();
    expect(result).toBe(1);
  });

  test("WHEN there was an error editing data file in bucket THEN should throw an error", async () => {
    const error = "ERROR EDITING FILE";

    NewGame.checkDataFile = jest.fn(() => Promise.resolve({ ...dataMock }));
    NewGame.s3.putObject = jest.fn((params, cb) => cb(error, {}));

    try {
      await NewGame.create();
    } catch (e) {
      expect(e.message).toBe(error);
    }
  });
});
