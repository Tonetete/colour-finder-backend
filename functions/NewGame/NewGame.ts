const S3 = require("aws-sdk/clients/s3");
const { AWS_REGION_NAME, BUCKET_NAME } = process.env;

class NewGame {
  static s3: any;
  static colours: string[];
  static gameState: string[];
  static indexFileName: string;

  static init() {
    this.indexFileName = "index.txt";
    this.colours = ["R", "G", "P", "Y", "B"];
    this.s3 = new S3({
      region: AWS_REGION_NAME,
    });
  }

  static generateGameState() {
    this.gameState = this.colours
      .map((item) => item)
      .sort(() => Math.random() - 0.5);
  }

  static async getLastIndex(): Promise<string> {
    const params = {
      Bucket: BUCKET_NAME,
      Key: this.indexFileName,
    };

    const lastIndex = await new Promise<string>((resolve) =>
      this.s3.getObject(params, (error: any, data: any) => {
        if (error) {
          throw new Error(error);
        }
        resolve(`${Number(data.Body.toString("utf-8")) + 1}`);
      })
    );

    const editIndex = await new Promise<any>((resolve) =>
      this.s3.putObject(
        { Body: `${lastIndex}`, ...params },
        (error: any, data: any) => {
          if (error) {
            throw new Error(error);
          }
          resolve(data);
        }
      )
    );

    if (editIndex) {
      return Promise.resolve(lastIndex);
    } else {
      throw new Error("There was an error creating/editing the index file");
    }
  }

  static async checkIndexFile(): Promise<boolean> {
    const result = await new Promise((resolve) =>
      this.s3.getObject(
        {
          Bucket: BUCKET_NAME,
          Key: this.indexFileName,
        },
        (error: any, data: any) => {
          if (error) {
            resolve(false);
          }
          resolve(true);
        }
      )
    );

    if (!result) {
      const params = {
        Body: "0",
        Bucket: BUCKET_NAME,
        Key: this.indexFileName,
      };
      return await new Promise((resolve) =>
        this.s3.putObject(params, (error: any, data: any) => {
          if (error) {
            throw new Error(error);
          }
          resolve(true);
        })
      );
    } else {
      return Promise.resolve(true);
    }
  }

  static async create() {
    const result = await this.checkIndexFile();
    if (result) {
      const index = await this.getLastIndex();
      this.generateGameState();
      const params = {
        Body: this.gameState.join(" "),
        Bucket: BUCKET_NAME,
        Key: `${index}.txt`,
      };
      return await new Promise((resolve) =>
        this.s3.putObject(params, (error: any, data: any) => {
          if (error) {
            throw new Error(error);
          }
          resolve(index);
        })
      );
    } else {
      throw new Error("No index file were created.");
    }
  }
}

export { NewGame };
