import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";

const registerUser = asyncHandler(async (req, res) => {
  res.send(200).json({
    message: "ok",
  });
});

export { registerUser };
