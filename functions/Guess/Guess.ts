import S3 from "aws-sdk/clients/s3";
const { AWS_REGION_NAME, BUCKET_NAME } = process.env;
import { GameUserFileProps } from "../NewGame";

interface GuessProps {
  gameId: number;
  userCombination: string[];
}

class Guess {
  static userCombination: GuessProps["userCombination"];
  static gameId: GuessProps["gameId"];
  static dataFileName: string = "data.json";
  static s3: any;

  static init(gameId: GuessProps["gameId"]) {
    this.gameId = gameId;
    this.s3 = new S3({
      region: AWS_REGION_NAME,
    });
  }

  static async checkAttempt(
    userCombination: GuessProps["userCombination"],
    data: GameUserFileProps
  ) {
    const indexGame = data.games?.findIndex((g) => g.id === this.gameId);
    if (indexGame !== -1) {
      const game = data.games[indexGame];
      if (game.attempts === game.numAttempts) {
        return { message: "You LOSE" };
      }
      const occurrences = userCombination.reduce(
        (prev: number, curr: string, index: number) => {
          if (curr === game.gameState[index]) {
            return prev + 1;
          }
          return prev;
        },
        0
      );
      if (occurrences === game.gameState.length) {
        return { message: "You WIN" };
      }

      await this.increaseAttemptGame(data, indexGame);
      return { occurrences };
    }
    throw new Error(`No game with id ${this.gameId} was found.`);
  }

  static async increaseAttemptGame(data: GameUserFileProps, indexGame: number) {
    const putObjectData = { ...data };
    putObjectData.games[indexGame].attempts += 1;
    return new Promise((resolve) =>
      this.s3.putObject(
        {
          Body: JSON.stringify({ ...putObjectData }),
          Bucket: BUCKET_NAME,
          Key: this.dataFileName,
        },
        (errorPutObject: any, dataPutObject: any) => {
          if (errorPutObject) {
            throw new Error(errorPutObject);
          }
          resolve(true);
        }
      )
    );
  }

  static async guess(
    userCombination: GuessProps["userCombination"]
  ): Promise<{ occurrences?: number; message?: string }> {
    return new Promise((resolve) =>
      this.s3.getObject(
        {
          Bucket: BUCKET_NAME,
          Key: this.dataFileName,
        },
        (error: any, data: any) => {
          if (error) {
            throw new Error(error);
          }
          const result: GameUserFileProps = JSON.parse(
            data.Body.toString("utf-8")
          );
          resolve(this.checkAttempt(userCombination, result));
        }
      )
    );
  }
}

export { Guess };
