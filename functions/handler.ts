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
    if (event?.pathParameters?.numAttempts) {
      const { numAttempts } = event.pathParameters;
      NewGame.init(numAttempts);
      const gameId = await NewGame.create();
      return createResponse(200, { id: gameId });
    }
    return createResponse(400, { message: "Bad Request" });
  } catch (e) {
    return createResponse(500, e.message);
  }
};

const guess = async (event: EventProps, context: any, callback: any) => {
  try {
    if (
      event?.pathParameters?.gameId &&
      event?.pathParameters?.userCombination
    ) {
      const { gameId, userCombination } = event.pathParameters;
      Guess.init(gameId);
      const result = await Guess.guess(userCombination);
      return createResponse(200, { ...result });
    }
    return createResponse(400, { message: "Bad Request" });
  } catch (e) {
    return createResponse(500, e.message);
  }
};

module.exports = { newGame, guess };
