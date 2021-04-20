import S3 from "aws-sdk/clients/s3";
const { AWS_REGION_NAME, BUCKET_NAME } = process.env;

export interface GameUserFileProps {
  lastIndex: number;
  games?: {
    id: number;
    numAttemps: number;
    attemps: number;
    gameState: string[];
  }[];
}

class NewGame {
  static s3: any;
  static colours: string[];
  static numAttemps: number;
  static dataFileName: string;

  static init(numAttemps: number) {
    this.numAttemps = numAttemps;
    this.dataFileName = "data.json";
    this.colours = ["R", "G", "P", "Y", "B"];
    this.s3 = new S3({
      region: AWS_REGION_NAME,
    });
  }

  static generateGameState() {
    return this.colours.map((item) => item).sort(() => Math.random() - 0.5);
  }

  static async checkDataFile(): Promise<GameUserFileProps> {
    const dataFileGetObject = await new Promise<GameUserFileProps | null>(
      (resolveGetObject) =>
        this.s3.getObject(
          {
            Bucket: BUCKET_NAME,
            Key: this.dataFileName,
          },
          (error: any, dataGetObject: any) => {
            if (error && error.name === "NoSuchKey") {
              // File doesn't exist
              resolveGetObject(null);
            } else if (error) {
              throw new Error(error);
            }
            const result: GameUserFileProps = JSON.parse(
              dataGetObject.Body.toString("utf-8")
            );
            resolveGetObject(result);
          }
        )
    );

    return !dataFileGetObject
      ? new Promise((resolvePutObject) =>
          this.s3.putObject(
            {
              Body: JSON.stringify({ lastIndex: 0 }),
              Bucket: BUCKET_NAME,
              Key: this.dataFileName,
            },
            (errorPutObject: any, dataPutObject: any) => {
              if (errorPutObject) {
                throw new Error(errorPutObject);
              }
              resolvePutObject({ games: [], lastIndex: 0 });
            }
          )
        )
      : dataFileGetObject;
  }

  static async create(): Promise<number> {
    const dataFile = await this.checkDataFile();
    dataFile.lastIndex += 1;

    const games = dataFile?.games ? [...dataFile.games] : [];
    games.push({
      id: dataFile.lastIndex,
      attemps: 0,
      numAttemps: this.numAttemps,
      gameState: this.generateGameState(),
    });

    const params = {
      Body: JSON.stringify({
        lastIndex: dataFile.lastIndex,
        games,
      }),
      Bucket: BUCKET_NAME,
      Key: this.dataFileName,
    };
    return new Promise((resolve) =>
      this.s3.putObject(params, (error: any, data: any) => {
        if (error) {
          throw new Error(error);
        }
        resolve(dataFile.lastIndex);
      })
    );
  }
}

export { NewGame };
