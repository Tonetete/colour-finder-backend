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
          const game = result.games?.find((g) => g.id === this.gameId);

          if (game && game.attempts === game.numAttempts) {
            resolve({ message: "You LOSE" });
          } else {
            const occurrences = userCombination.reduce(
              (prev: number, curr: string, index: number) => {
                if (curr === game?.gameState[index]) {
                  return prev + 1;
                }
                return prev;
              },
              0
            );
            resolve(
              occurrences === game?.gameState.length
                ? { message: "You WIN" }
                : { occurrences }
            );
          }
        }
      )
    );
  }
}

export { Guess };
