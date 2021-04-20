import { Guess } from "./Guess";

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
  Body: {
    toString: () =>
      JSON.stringify({
        lastIndex: 0,
        games: [
          {
            id: 0,
            attempts: 0,
            numAttempts: 3,
            gameState: ["R", "Y", "P", "G", "B"],
          },
        ],
      }),
  },
};

beforeEach(() => {
  Guess.init(0);
  Guess.s3.putObject = jest.fn((params, cb) => cb(null, {}));
});

describe("Guess Lambda UT", () => {
  test("WHEN get game state from data file THEN should compare number of occurences with user given", async () => {
    const userCombination = ["Y", "G", "P", "R", "G"];

    Guess.s3.getObject = jest.fn((params, cb) => cb(null, dataMock));

    const result = await Guess.guess(userCombination);

    expect(result).toEqual({ occurrences: 1 });
  });

  test("WHEN the user reach max of attemps THEN should return message of him being a loser", async () => {
    const userCombination = ["Y", "G", "P", "R", "G"];
    const parseData = JSON.parse(dataMock.Body.toString());
    parseData.games[0].attempts = 3;

    Guess.s3.getObject = jest.fn((params, cb) =>
      cb(null, { Body: { toString: () => JSON.stringify({ ...parseData }) } })
    );

    const result = await Guess.guess(userCombination);

    expect(result).toEqual({ message: "You LOSE" });
  });

  test("WHEN the user hits all the occurrences THEN should return message of him being a winner", async () => {
    const userCombination = ["R", "Y", "P", "G", "B"];

    Guess.s3.getObject = jest.fn((params, cb) => cb(null, dataMock));

    const result = await Guess.guess(userCombination);

    expect(result).toEqual({ message: "You WIN" });
  });

  test("WHEN there was an unexpected error reading file from bucket THEN should throw an error", async () => {
    const error = "UNEXPECTED ERROR";
    const userCombination = ["R", "Y", "P", "G", "B"];

    Guess.s3.getObject = jest.fn((params, cb) => cb(error, {}));

    try {
      await Guess.guess(userCombination);
    } catch (e) {
      expect(e.message).toBe(error);
    }
  });

  test("WHEN there was an unexpected error editing file from bucket THEN should throw an error", async () => {
    const error = "UNEXPECTED ERROR";
    const userCombination = ["Y", "G", "P", "R", "G"];

    Guess.s3.getObject = jest.fn((params, cb) => cb(null, dataMock));
    Guess.s3.putObject = jest.fn((params, cb) => cb(error, {}));

    try {
      await Guess.guess(userCombination);
    } catch (e) {
      expect(e.message).toBe(error);
    }
  });
});
