import { Guess } from "./Guess";

jest.mock("aws-sdk/clients/s3", () => {
  return class S3 {
    dataFileName = "data.json";
    region;
    constructor({ region }) {
      this.region = region;
    }
    getObject() {}
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
            attemps: 0,
            numAttemps: 3,
            gameState: ["R", "Y", "P", "G", "B"],
          },
        ],
      }),
  },
};

describe("Guess Lambda UT", () => {
  test("WHEN get game state file THEN should compare number of occurences with user given", async () => {
    const userCombination = ["Y", "G", "P", "R", "G"];

    Guess.init(0);
    Guess.s3.getObject = jest.fn((params, cb) => cb(null, dataMock));

    const result = await Guess.guess(userCombination);

    expect(result).toEqual({ occurrences: 1 });
  });

  test("WHEN the user reach max of attemps THEN should return message of him being a loser", async () => {
    const userCombination = ["Y", "G", "P", "R", "G"];
    const parseData = JSON.parse(dataMock.Body.toString());
    parseData.games[0].attemps = 3;

    Guess.init(0);
    Guess.s3.getObject = jest.fn((params, cb) =>
      cb(null, { Body: { toString: () => JSON.stringify({ ...parseData }) } })
    );

    const result = await Guess.guess(userCombination);

    expect(result).toEqual({ message: "You LOSE" });
  });

  test("WHEN the user hits all the occurrences THEN should return message of him being a winner", async () => {
    const userCombination = ["R", "Y", "P", "G", "B"];
    Guess.init(0);
    Guess.s3.getObject = jest.fn((params, cb) => cb(null, dataMock));

    const result = await Guess.guess(userCombination);

    expect(result).toEqual({ message: "You WIN" });
  });

  test("WHEN there was an unexpected error reading file from bucket THEN should throw an error", async () => {
    const error = "UNEXPECTED ERROR";
    const userCombination = ["R", "Y", "P", "G", "B"];
    Guess.init(0);
    Guess.s3.getObject = jest.fn((params, cb) => cb(error, {}));

    try {
      await Guess.guess(userCombination);
    } catch (e) {
      expect(e.message).toBe(error);
    }
  });
});
