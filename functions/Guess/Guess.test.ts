import { Guess } from "./Guess";

jest.mock("aws-sdk/clients/s3", () => {
  return class S3 {
    indexFile = "index.txt";
    region;
    constructor({ region }) {
      this.region = region;
    }
    getObject() {}
  };
});

describe("Guess Lambda UT", () => {
  test("WHEN get game state file THEN should compare number of occurences with user given", async () => {
    const gameState = "R Y P G B";
    const userCombination = ["Y", "G", "P", "G", "R"];
    const data = { Body: { toString: () => gameState } };

    Guess.init(1);
    Guess.s3.getObject = jest.fn((params, cb) => cb(null, data));

    const result = await Guess.guess(userCombination);

    expect(result).toEqual({ occurrences: 2 });
  });

  test("WHEN get game state fails THEN should throw an error", async () => {
    const gameState = "R Y P G B";
    const userCombination = ["Y", "G", "P", "G", "R"];
    const data = { Body: { toString: () => gameState } };
    const error = "INDEX FILE GAME STATE NOT FOUND";

    Guess.init(1);
    Guess.s3.getObject = jest.fn((params, cb) => cb(error, data));

    try {
      const result = await Guess.guess(userCombination);
    } catch (e) {
      expect(e.message).toBe(error);
    }
  });
});
