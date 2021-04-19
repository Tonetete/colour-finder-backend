const https = require("https");
const dotenv = require("dotenv");
const { createResponse } = require("./CreateResponse");
const { NewGame } = require("./NewGame");
const { Guess } = require("./Guess");
dotenv.config();

interface EventProps {
  pathParameters: {
    [key: string]: any;
  };
}

interface CallbackProps {}

const newGame = async (event: EventProps, context: any, callback: any) => {
  try {
    NewGame.init();
    const gameId = await NewGame.create();
    return createResponse(200, { id: gameId });
  } catch (e) {
    console.error(e);
    return createResponse(500, e);
  }
};

const guess = async (event: EventProps, context: any, callback: any) => {
  try {
    const { gameId, userCombination } = event.pathParameters;
    Guess.init(gameId);
    const result = await Guess.guess(userCombination);
    return createResponse(200, { ...result });
  } catch (e) {
    console.error(e);
    return createResponse(500, e);
  }
};

module.exports = { newGame, guess };
