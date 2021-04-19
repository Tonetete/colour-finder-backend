import S3 from "aws-sdk/clients/s3";
const { AWS_REGION_NAME, BUCKET_NAME } = process.env;

interface GuessProps {
  gameId: number;
  userCombination: string[];
}

class Guess {
  static userCombination: GuessProps["userCombination"];
  static gameId: GuessProps["gameId"];
  static s3: any;

  static init(gameId: GuessProps["gameId"]) {
    this.gameId = gameId;
    this.s3 = new S3({
      region: AWS_REGION_NAME,
    });
  }

  static async guess(
    userCombination: GuessProps["userCombination"]
  ): Promise<{ occurrences: number }> {
    return await new Promise((resolve) =>
      this.s3.getObject(
        {
          Bucket: BUCKET_NAME,
          Key: `${this.gameId}.txt`,
        },
        (error: any, data: any) => {
          if (error) {
            throw new Error(error);
          }
          const gameState = data.Body.toString("utf-8").split(" ");
          const occurrences = userCombination.reduce(
            (prev: number, curr: string, index: number) => {
              if (curr === gameState[index]) {
                return prev + 1;
              }
              return prev;
            },
            0
          );
          resolve({ occurrences });
        }
      )
    );
  }
}

export { Guess };
