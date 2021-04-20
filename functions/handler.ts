import https from "https";
import dotenv from "dotenv";
import { createResponse } from "./CreateResponse";
import { NewGame } from "./NewGame";
import { Guess } from "./Guess";
dotenv.config();

interface EventProps {
  pathParameters: {
    [key: string]: any;
  };
}

const newGame = async (event: EventProps, context: any, callback: any) => {
  try {
    if (event?.pathParameters?.numAttemps) {
      const { numAttemps } = event.pathParameters;
      NewGame.init(numAttemps);
      const gameId = await NewGame.create();
      return createResponse(200, { id: gameId });
    }
    return createResponse(400, { message: "Bad Request" });
  } catch (e) {
    return createResponse(500, e);
  }
};

const guess = async (event: EventProps, context: any, callback: any) => {
  try {
    if (
      event.pathParameters?.gameId &&
      event?.pathParameters?.userCombination
    ) {
      const { gameId, userCombination } = event.pathParameters;
      Guess.init(gameId);
      const result = await Guess.guess(userCombination);
      return createResponse(200, { ...result });
    }
    return createResponse(400, { message: "Bad Request" });
  } catch (e) {
    return createResponse(500, e);
  }
};

module.exports = { newGame, guess };
