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
    const { numAttemps } = event.pathParameters;
    if (numAttemps) {
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
    const { gameId, userCombination } = event.pathParameters;
    if (gameId && userCombination) {
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
